import music21
from music21 import stream, harmony, note, meter, metadata, clef, instrument
from app.models.schemas import GenerationRequest, Difficulty
from app.services.gemini import generate_adlib_solo, API_KEY
from typing import Tuple
import io

def generate_solo_xml(request: GenerationRequest) -> Tuple[str, str]:
    """
    Generate a solo based on the chord progression.
    Prioritizes Gemini (AI Brain) for generation.
    Falls back to simple music21 logic if API is unavailable or fails.
    
    Returns:
        Tuple[str, str]: (music_xml_content, explanation_text)
    """
    
    # Debug info
    print(f"DEBUG: generate_solo_xml called.")
    print(f"DEBUG: API_KEY is present: {bool(API_KEY)}")
    
    # 1. Try using Gemini (AI Brain)
    if API_KEY:
        try:
            print("Attempting to generate solo using Gemini...")
            result = generate_adlib_solo(request.chords, request.config)
            
            if "music_xml" in result:
                raw_xml = result["music_xml"]
                explanation = result.get("explanation", "AI generated solo based on music theory.")
                
                # --- 楽譜の整合性を保つための後処理 ---
                try:
                    print("Geminiが生成したXMLを整形して、コード進行と小節の整合性を整えるよ...")
                    # AIが生成したXMLをmusic21でパース（解析）する
                    s = music21.converter.parseData(raw_xml)
                    
                    # メタデータがなければ作成して、作曲者名をセット！
                    if not s.metadata:
                        s.metadata = metadata.Metadata()
                    s.metadata.composer = "Ad-lib Mate AI"

                    # パート（通常は1つ）ごとに処理していくよ
                    for p in s.parts:
                        # 重複を防ぐために、既存のコードシンボルを一旦クリアするね
                        for el in list(p.flatten().getElementsByClass('ChordSymbol')):
                            p.remove(el, recurse=True)

                        # リクエストされた正しいコード進行を、各小節に確実に埋め込んでいくよ
                        for measure_data in request.chords:
                            # 該当する小節を探す
                            m = p.measure(measure_data.measure_number)
                            if m is None:
                                continue # 小節が見つからない場合はスキップ

                            num_chords = len(measure_data.chords)
                            if num_chords == 0:
                                continue

                            # 1小節内のコードを等間隔に配置するよ（4/4拍子を想定）
                            duration_per_chord = 4.0 / num_chords
                            
                            for i, chord_str in enumerate(measure_data.chords):
                                try:
                                    h = harmony.ChordSymbol(chord_str)
                                    # 正しい位置（オフセット）にコードを挿入！
                                    offset = i * duration_per_chord
                                    m.insert(offset, h)
                                    
                                except Exception as e:
                                    print(f"コード {chord_str} の挿入中にエラーが出ちゃった: {e}")

                    # 綺麗に整えた楽譜を再びMusicXMLに書き出すよ
                    gex = music21.musicxml.m21ToXml.GeneralObjectExporter(s)
                    out_bytes = gex.parse()
                    final_xml = out_bytes.decode('utf-8')
                    
                    return final_xml, explanation

                except Exception as e:
                    print(f"XMLの後処理中にエラーが発生しちゃった: {e}")
                    import traceback
                    traceback.print_exc()
                    # 後処理に失敗しても、せっかくAIが作ったものだから生データを返しておくね
                    return raw_xml, explanation

        except Exception as e:
            print(f"Gemini generation failed, falling back to basic logic: {e}")
            import traceback
            traceback.print_exc()

    # 2. Fallback: Basic Logic using music21
    print("Generating solo using basic music21 logic (Fallback Mode)...")
    
    # Create a Score
    s = stream.Score()
    s.metadata = metadata.Metadata()
    s.metadata.title = "Ad-lib Mate Generated Solo (Basic)"
    s.metadata.composer = "Ad-lib Mate AI"

    # Create a Part
    p = stream.Part()
    
    # Set Instrument (Simple logic for now)
    if request.config.instrument == "Saxophone":
         p.insert(0, instrument.AltoSaxophone())
    elif request.config.instrument == "Trumpet":
         p.insert(0, instrument.Trumpet())
    else:
         p.insert(0, instrument.Piano())

    # Set Clef and Time Signature
    p.insert(0, clef.TrebleClef())
    p.insert(0, meter.TimeSignature('4/4'))

    # Iterate through measures and chords
    for measure_data in request.chords:
        m = stream.Measure(number=measure_data.measure_number)
        
        # Calculate duration per chord in a 4/4 measure
        # Assuming equal distribution for MVP (e.g., 1 chord = whole, 2 chords = halfs)
        num_chords = len(measure_data.chords)
        if num_chords == 0:
            r = note.Rest(quarterLength=4.0)
            m.append(r)
            p.append(m)
            continue
            
        duration_per_chord = 4.0 / num_chords
        
        for chord_str in measure_data.chords:
            try:
                # Basic generation logic based on difficulty
                # Beginner: Just the Root note
                h = harmony.ChordSymbol(chord_str)
                root_note_name = h.root().nameWithOctave
                # Default octave adjustment for treble clef if needed
                # music21 usually picks a default octave (often 4 or 3 for bass)
                
                n = note.Note(root_note_name)
                n.quarterLength = duration_per_chord
                
                # Add simple text annotation for the chord
                n.addLyric(chord_str)
                
                m.append(n)
            except Exception as e:
                print(f"Error processing chord {chord_str}: {e}")
                r = note.Rest(quarterLength=duration_per_chord)
                r.addLyric(chord_str + "?")
                m.append(r)

        p.append(m)

    s.append(p)

    # Export to MusicXML string
    # GEX (General Export) to bytes
    gex = music21.musicxml.m21ToXml.GeneralObjectExporter(s)
    out_bytes = gex.parse()
    
    return out_bytes.decode('utf-8'), "Generated based on root notes for beginner difficulty (Offline Mode)."

if __name__ == "__main__":
    # Test block
    pass
