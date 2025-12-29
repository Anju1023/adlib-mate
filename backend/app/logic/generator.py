import music21
from music21 import stream, harmony, note, meter, metadata, clef, instrument
from backend.app.models.schemas import GenerationRequest, Difficulty
import io

def generate_solo_xml(request: GenerationRequest) -> str:
    """
    Generate a simple solo based on the chord progression using music21.
    For MVP: Just plays the root of the chord as a whole note or half note.
    """
    
    # Create a Score
    s = stream.Score()
    s.metadata = metadata.Metadata()
    s.metadata.title = "Ad-lib Mate Generated Solo"
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
    # music21 writes to a file by default. We need to capture the content.
    # Using specific options to write to a string buffer is not direct in all versions,
    # but we can use the 'musicxml' format writer.
    
    # GEX (General Export) to bytes
    gex = music21.musicxml.m21ToXml.GeneralObjectExporter(s)
    out_bytes = gex.parse()
    
    return out_bytes.decode('utf-8')

if __name__ == "__main__":
    # Test block
    pass
