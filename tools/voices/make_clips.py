"""Make the prototype's voice clips once, offline, with AI4Bharat Indic Parler-TTS (Apache-2.0).

Usage: python make_clips.py <out_dir>      (writes <id>.mp3 and clips.json; needs ffmpeg on PATH)
Skips clips that already exist, so it can be re-run after a failure.
"""
import json
import subprocess
import sys
from pathlib import Path

import soundfile as sf
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer

QUALITY = "The recording is of very high quality, with the speaker's voice sounding clear and very close up."
VOICES = {
    # calm KAVACH voice, one per language (speaker names come from the model card)
    "kavach_kn": f"Anu speaks in a calm, warm and reassuring voice at a slightly slow pace. {QUALITY}",
    "kavach_hi": f"Divya speaks in a calm, warm and reassuring voice at a slightly slow pace. {QUALITY}",
    "kavach_en": f"Mary speaks in a calm, warm and reassuring voice at a moderate pace. {QUALITY}",
    "scammer_en": "Dinesh speaks in a stern, commanding and fast voice with a hint of urgency. The recording is slightly noisy, like a phone line.",
    "scammer_hi": "Rohit speaks in a stern, commanding and fast voice with urgency. The recording is slightly noisy, like a phone line.",
    "ramesh_en": f"Thoma speaks slowly in an old man's gentle, slightly hesitant voice with pauses. {QUALITY}",
}

CLIPS = [
    # Amma's warning after she taps KAVACH
    ("warn_kn", "kn", "kavach_kn", "ಅಮ್ಮಾ, ಇದು ಸುಳ್ಳು ಕರೆ! ಭಾರತದ ಯಾವುದೇ ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ವಿಡಿಯೋ ಕಾಲಿನಲ್ಲಿ ಯಾರನ್ನೂ ಬಂಧಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೂಡಲೇ ಕರೆ ಕಟ್ ಮಾಡಿ."),
    ("warn_hi", "hi", "kavach_hi", "अम्मा, यह एक फर्जी कॉल है! भारत में कोई भी पुलिस या सीबीआई अधिकारी वीडियो कॉल पर गिरफ़्तारी नहीं करता। कृपया तुरंत फोन काटें।"),
    ("warn_en", "en", "kavach_en", "Amma, this is a scam. Real police or CBI officers never arrest anyone over a video call. Please hang up now."),
    # voice note after checking the SMS
    ("sms_kn", "kn", "kavach_kn", "ಅಮ್ಮಾ, ಇದು ನಕಲಿ ಸಂದೇಶ. ಆ ಲಿಂಕ್ ಮೇಲೆ ಒತ್ತಬೇಡಿ, ಯಾರಿಗೂ ಹಣ ಕಳುಹಿಸಬೇಡಿ."),
    ("sms_hi", "hi", "kavach_hi", "अम्मा, यह एक फर्जी मैसेज है। किसी भी लिंक पर क्लिक न करें, किसी को पैसे न भेजें।"),
    ("sms_en", "en", "kavach_en", "Amma, this message is a scam. Do not tap the link, and do not send anyone money."),
    # recovery started
    ("recover_kn", "kn", "kavach_kn", "ಅಮ್ಮಾ, ಭಯಪಡಬೇಡಿ. ರಾಹುಲ್‌ಗೆ ತಿಳಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಹಣವನ್ನು ಮರಳಿ ಪಡೆಯಲು ಕವಚ ಕೆಲಸ ಶುರು ಮಾಡಿದೆ."),
    ("recover_hi", "hi", "kavach_hi", "अम्मा, घबराइए मत। राहुल को बता दिया गया है। आपका पैसा वापस लाने का काम कवच ने शुरू कर दिया है।"),
    ("recover_en", "en", "kavach_en", "Amma, don't worry. Rahul knows, and KAVACH has started getting your money back."),
    # what KAVACH says to the caller when it joins
    ("announce_en", "en", "kavach_en", "This is KAVACH. This call is now monitored for fraud and is being recorded."),
    # the fake officer
    ("scam_1", "en", "scammer_en", "This is Inspector Alok Verma, CBI Cyber Crime, New Delhi. A non-bailable digital arrest warrant has been issued against your Aadhaar."),
    ("scam_2", "hi", "scammer_hi", "वीडियो कॉल पर बने रहिए। किसी को कुछ मत बताइए, वरना अभी गिरफ़्तारी होगी।"),
    ("scam_3", "en", "scammer_en", "Open Google Pay and send fifty thousand rupees security deposit to refund dot C B I at ok axis. Do it now!"),
    # Ramesh, the decoy
    ("ramesh_1", "en", "ramesh_en", "Haan beta... security deposit? But my pension comes in Canara Bank. Where should I send it? Let me find my reading glasses."),
    ("ramesh_2", "en", "ramesh_en", "Refund dot C B I at ok axis... beta, can you spell it slowly? My grandson set up this phone. What was the account number?"),
    ("ramesh_3", "en", "ramesh_en", "H D F C, Salt Lake... wait beta, the screen went black! Now it is asking for a six digit PIN. Should I put my birth year?"),
]


def main(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.manual_seed(7)  # same voices on every run
    model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts")
    tok = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
    desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    rate = model.config.sampling_rate
    index = []
    for clip_id, lang, voice, text in CLIPS:
        mp3 = out_dir / f"{clip_id}.mp3"
        index.append({"id": clip_id, "lang": lang, "speaker": voice.split("_")[0], "text": text, "src": mp3.name})
        if mp3.exists():
            continue
        d = desc_tok(VOICES[voice], return_tensors="pt")
        p = tok(text, return_tensors="pt")
        with torch.inference_mode():
            audio = model.generate(input_ids=d.input_ids, attention_mask=d.attention_mask,
                                   prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
        wav = out_dir / f"{clip_id}.wav"
        sf.write(wav, audio.cpu().numpy().squeeze(), rate)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-af", "loudnorm=I=-16:TP=-1.5",
                        "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
        wav.unlink()
        print("made", clip_id, flush=True)
    (out_dir / "clips.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
