import os
import io
import tempfile
import re
import numpy as np
from faster_whisper import WhisperModel
from typing import Optional
from pydub import AudioSegment
from pydub.effects import normalize, compress_dynamic_range
from pydub.silence import split_on_silence, detect_nonsilent

# Global model instance
_model: Optional[WhisperModel] = None

def get_model():
    """Get or create Whisper model singleton"""
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "small")
        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = "int8" if device == "cpu" else "float16"
        
        _model = WhisperModel(
            model_name,
            device=device,
            compute_type=compute_type
        )
    return _model

def _is_repetitive_numbers(text: str) -> bool:
    """
    Check if text contains repetitive number patterns that are likely hallucinations
    """
    # Extract all numbers from the text
    numbers = re.findall(r'\d+', text)
    
    if len(numbers) < 3:
        return False
    
    # Check for repetitive patterns (same number repeated many times)
    number_counts = {}
    for num in numbers:
        number_counts[num] = number_counts.get(num, 0) + 1
    
    # If any number appears more than 5 times, it's likely repetitive
    max_count = max(number_counts.values()) if number_counts else 0
    if max_count > 5:
        return True
    
    # Check for alternating patterns (like "20, 25, 20, 25")
    if len(numbers) > 6:
        # Check if the last 6 numbers form a repeating pattern
        last_six = numbers[-6:]
        if (last_six[0] == last_six[2] == last_six[4] and 
            last_six[1] == last_six[3] == last_six[5]):
            return True
    
    return False

def _enhance_audio_quality(audio: AudioSegment) -> AudioSegment:
    """
    Enhance audio quality for better transcription in noisy environments
    """
    try:
        # Convert to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)
        
        # Normalize audio levels
        audio = normalize(audio)
        
        # Apply dynamic range compression to reduce noise
        audio = compress_dynamic_range(audio, threshold=-20.0, ratio=4.0, attack=5.0, release=50.0)
        
        # Remove silence at the beginning and end
        non_silent_ranges = detect_nonsilent(audio, min_silence_len=500, silence_thresh=-40)
        if non_silent_ranges:
            start_time = max(0, non_silent_ranges[0][0] - 100)  # 100ms buffer
            end_time = min(len(audio), non_silent_ranges[-1][1] + 100)  # 100ms buffer
            audio = audio[start_time:end_time]
        
        # Ensure minimum duration (at least 0.5 seconds)
        if len(audio) < 500:
            # Pad with silence if too short
            silence = AudioSegment.silent(duration=500 - len(audio))
            audio = audio + silence
        
        # Set optimal sample rate for Whisper (16kHz)
        if audio.frame_rate != 16000:
            audio = audio.set_frame_rate(16000)
        
        return audio
    except Exception as e:
        print(f"Audio enhancement failed: {e}")
        return audio

def _convert_audio_format(audio_bytes: bytes) -> bytes:
    """
    Convert audio bytes to enhanced WAV format for better compatibility and quality
    """
    try:
        # Try to load the audio with pydub
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        
        # Enhance audio quality
        audio = _enhance_audio_quality(audio)
        
        # Convert to WAV format with optimal settings
        wav_buffer = io.BytesIO()
        audio.export(
            wav_buffer, 
            format="wav",
            parameters=["-ac", "1", "-ar", "16000"]  # Mono, 16kHz
        )
        return wav_buffer.getvalue()
    except Exception as e:
        error_msg = str(e).lower()
        if "ffmpeg" in error_msg or "no such file" in error_msg:
            print(f"❌ FFmpeg not found: {e}")
            print("🔧 To fix this issue:")
            print("   1. Run: .\\install-ffmpeg.ps1 (PowerShell)")
            print("   2. Or run: install-ffmpeg.bat (Command Prompt)")
            print("   3. Or install manually: https://ffmpeg.org/download.html")
            print("   4. Restart your terminal after installation")
            raise Exception("FFmpeg is required for audio processing. Please install FFmpeg and restart the server.")
        else:
            print(f"Audio conversion failed: {e}")
            print("Using original audio format - this may work with Whisper")
            # Return original bytes if conversion fails
            return audio_bytes

def transcribe_bytes(audio: bytes, language: str = "auto") -> str:
    """
    Transcribe audio bytes using Whisper with improved accuracy
    
    Args:
        audio: Raw audio bytes (WebM format from browser)
        language: Language code ("en", "hi", or "auto" for auto-detection)
    
    Returns:
        Transcribed text
    """
    try:
        print(f"Transcribing audio: {len(audio)} bytes, language: {language}")
        
        # Validate audio data
        if not audio or len(audio) < 100:
            raise Exception("Invalid or empty audio data")
        
        model = get_model()
        
        # Try to convert audio to a more compatible format
        try:
            converted_audio = _convert_audio_format(audio)
            audio_file = io.BytesIO(converted_audio)
        except Exception as e:
            print(f"Audio conversion failed, using original: {e}")
            audio_file = io.BytesIO(audio)
        
        # Auto-detect language if requested
        if language == "auto":
            # First pass: detect language (restricted to English/Hindi)
            segments, info = model.transcribe(
                audio_file,
                language=None,  # Auto-detect
                beam_size=1,
                best_of=1,
                vad_filter=True,  # Voice activity detection
                vad_parameters=dict(min_silence_duration_ms=500)
            )
            detected_language = info.language if info.language else "en"
            
            # Restrict to English or Hindi only for medical use in India
            if detected_language not in ["en", "hi"]:
                detected_language = "en"  # Default to English for medical terminology
                print(f"Language '{info.language}' not supported, defaulting to English")
            else:
                print(f"Detected language: {detected_language}")
            
            # Reset file pointer for second pass
            audio_file.seek(0)
            
            # Second pass: transcribe with detected language and enhanced noise handling
            segments, info = model.transcribe(
                audio_file,
                language=detected_language,
                beam_size=5,  # Increased for better accuracy in noise
                best_of=5,    # Increased for better accuracy in noise
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=500,  # Reduced for better speech detection
                    speech_pad_ms=200,  # Add padding around speech
                    max_speech_duration_s=30  # Prevent very long segments
                ),
                temperature=[0.0, 0.2, 0.4, 0.6, 0.8],  # Multiple temperatures for robustness
                compression_ratio_threshold=2.4,  # More lenient for noisy audio
                log_prob_threshold=-1.0,  # More lenient confidence threshold
                no_speech_threshold=0.6,   # More sensitive speech detection
                condition_on_previous_text=False,  # Prevent repetition from previous context
                initial_prompt="Medical consultation. Patient admission details. Clear speech. Name, age, contact, Aadhaar, admission date, time, ward, bed, reason."  # Enhanced context hint
            )
        else:
            # Transcribe with specified language and enhanced noise handling
            segments, info = model.transcribe(
                audio_file,
                language=language if language in ["en", "hi"] else "en",
                beam_size=5,  # Increased for better accuracy in noise
                best_of=5,    # Increased for better accuracy in noise
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=500,  # Reduced for better speech detection
                    speech_pad_ms=200,  # Add padding around speech
                    max_speech_duration_s=30  # Prevent very long segments
                ),
                temperature=[0.0, 0.2, 0.4, 0.6, 0.8],  # Multiple temperatures for robustness
                compression_ratio_threshold=2.4,  # More lenient for noisy audio
                log_prob_threshold=-1.0,  # More lenient confidence threshold
                no_speech_threshold=0.6,   # More sensitive speech detection
                condition_on_previous_text=False,  # Prevent repetition from previous context
                initial_prompt="Medical consultation. Patient admission details. Clear speech. Name, age, contact, Aadhaar, admission date, time, ward, bed, reason."  # Enhanced context hint
            )
        
        # Concatenate all segments with enhanced filtering for noisy environments
        text_parts = []
        seen_texts = set()  # Track seen text to prevent repetition
        confidence_scores = []  # Track confidence for quality assessment
        
        # Convert segments to list to avoid iterator exhaustion
        segments_list = list(segments)
        print(f"🔍 Processing {len(segments_list)} segments...")
        
        for i, segment in enumerate(segments_list):
            text = segment.text.strip()
            print(f"🔍 Segment {i+1}: \"{text}\" (confidence: {segment.avg_logprob:.2f})")
            
            # More lenient filtering for noisy environments
            if (len(text) > 1 and  # Allow shorter segments in noise
                segment.avg_logprob > -1.2 and  # More lenient confidence threshold
                text not in seen_texts and  # Prevent exact repetition
                not _is_repetitive_numbers(text) and  # Filter out number sequences
                not text.lower() in ['um', 'uh', 'ah', 'er', 'mm']):  # Filter filler words
                
                print(f"✅ Segment {i+1} accepted: \"{text}\"")
                text_parts.append(text)
                seen_texts.add(text)
                confidence_scores.append(segment.avg_logprob)
            else:
                print(f"❌ Segment {i+1} filtered out: \"{text}\" (reason: confidence={segment.avg_logprob:.2f}, length={len(text)})")
        
        result = " ".join(text_parts).strip()
        
        # Post-process result for better quality
        if result:
            # Remove extra whitespace
            result = re.sub(r'\s+', ' ', result).strip()
            
            # Log confidence information for debugging
            avg_confidence = np.mean(confidence_scores) if confidence_scores else -1.0
            print(f"Transcription confidence: {avg_confidence:.2f} (segments: {len(text_parts)})")
            
            # Log the actual transcript text
            print(f"📝 TRANSCRIPT: \"{result}\"")
        
        # Return empty string if no transcription
        if not result:
            print("📝 TRANSCRIPT: (empty - no speech detected)")
            return ""
            
        return result
        
    except Exception as e:
        error_msg = str(e)
        print(f"Transcription error: {error_msg}")
        
        # Provide more specific error messages
        if "Invalid data found when processing input" in error_msg:
            raise Exception("Invalid audio format. Please ensure the audio file is in a supported format (WebM, MP3, WAV, etc.)")
        elif "No such file or directory" in error_msg:
            raise Exception("Audio file not found or corrupted")
        elif "Permission denied" in error_msg:
            raise Exception("Permission denied accessing audio file")
        else:
            raise Exception(f"Transcription failed: {error_msg}")
