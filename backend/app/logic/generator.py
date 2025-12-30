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
                
                # --- Post-processing for Consistency ---
                try:
                    print("Post-processing Gemini XML to ensure chord/measure consistency...")
                    # Parse the AI generated XML
                    s = music21.converter.parseData(raw_xml)
                    
                    # Ensure metadata is set if missing
                    if not s.metadata:
                        s.metadata = metadata.Metadata()
                    s.metadata.composer = "Ad-lib Mate AI"

                    # Iterate through parts (usually just one)
                    for p in s.parts:
                        # Clear existing chords to avoid duplicates/inconsistencies
                        # We use a list to avoid modifying the iterator while looping
                        for el in list(p.flatten().getElementsByClass('ChordSymbol')):
                            p.remove(el, recurse=True)

                        # Re-insert chords from the request to guarantee they match inputs
                        # We assume measures are numbered sequentially starting from 1
                        for measure_data in request.chords:
                            # Find the measure
                            m = p.measure(measure_data.measure_number)
                            if m is None:
                                continue # measure might not exist in generated solo, skip

                            num_chords = len(measure_data.chords)
                            if num_chords == 0:
                                continue

                            # Distribute chords evenly in the measure
                            # This is a simplification; ideally we'd map to beats
                            # For MVP, assuming 4/4 and even distribution is better than nothing
                            duration_per_chord = 4.0 / num_chords
                            
                            for i, chord_str in enumerate(measure_data.chords):
                                try:
                                    h = harmony.ChordSymbol(chord_str)
                                    # Place the chord at the correct offset
                                    # offset = i * duration_per_chord
                                    # m.insert(offset, h)
                                    # Note: inserting directly into measure is safer for XML export
                                    # Using beat position
                                    beat_pos = 1.0 + (i * duration_per_chord)
                                    # music21 insert uses 0-based offset? No, measure offsets are usually relative
                                    # Actually measure.insert(offset, element)
                                    
                                    # music21 beat calculation:
                                    # beat 1 = offset 0.0
                                    offset = i * duration_per_chord
                                    m.insert(offset, h)
                                    
                                except Exception as e:
                                    print(f"Error inserting chord {chord_str}: {e}")

                    # Re-export to MusicXML
                    gex = music21.musicxml.m21ToXml.GeneralObjectExporter(s)
                    out_bytes = gex.parse()
                    final_xml = out_bytes.decode('utf-8')
                    
                    return final_xml, explanation

                except Exception as e:
                    print(f"Error during XML post-processing: {e}")
                    import traceback
                    traceback.print_exc()
                    # If post-processing fails, return raw XML as a fallback
                    # It's better to show something than nothing
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
