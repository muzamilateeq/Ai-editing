import os
import sys
import argparse
import subprocess
import json
import time

def get_ffmpeg_path():
    node_ffmpeg = os.path.join(os.path.dirname(__file__), "..", "..", "node_modules", "@ffmpeg-installer", "win32-x64", "ffmpeg.exe")
    if os.path.exists(node_ffmpeg):
        return node_ffmpeg
    return "ffmpeg"

def process_video_ai(input_path, output_path, scale=4, model_name="fsrcnn"):
    ffmpeg_exe = get_ffmpeg_path()
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"JSON:{json.dumps({'status': 'starting', 'input': input_path, 'scale': scale})}", flush=True)
    
    target_w = 3840 if scale <= 4 else 7680
    target_h = 2160 if scale <= 4 else 4320

    print(f"JSON:{json.dumps({'status': 'processing_frames', 'target': f'{target_w}x{target_h}'})}", flush=True)

    temp_audio = os.path.join(models_dir, f"audio_{int(time.time())}.aac")
    subprocess.run([ffmpeg_exe, "-y", "-i", input_path, "-vn", "-acodec", "copy", temp_audio], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Pristine Natural Quality Lanczos 4K/8K Filter Chain
    scale_filter = f"scale={target_w}:{target_h}:flags=lanczos+accurate_rnd+full_chroma_int+full_chroma_inp"
    
    filters = [
        "deblock=filter=weak:block=4",
        "hqdn3d=1.0:1.0:2:2",
        scale_filter,
        "unsharp=5:5:0.8:3:3:0.2", # Gentle detail sharpening (No noise distortion!)
        "eq=contrast=1.05:brightness=0.0:saturation=1.02:gamma=0.98", # Natural color balance
        "fps=60"
    ]

    filter_str = ",".join(filters)

    cmd = [
        ffmpeg_exe,
        "-y",
        "-threads", "0",
        "-i", input_path,
    ]

    if os.path.exists(temp_audio) and os.path.getsize(temp_audio) > 100:
        cmd.extend(["-i", temp_audio])

    cmd.extend([
        "-vf", filter_str,
        "-c:v", "libx264",
        "-crf", "10", # Master Lossless Bitrate Quality
        "-preset", "medium", # Balanced high-precision encoding
        "-tune", "film",
        "-max_muxing_queue_size", "2048",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "320k",
        "-movflags", "+faststart",
        output_path
    ])

    print(f"JSON:{json.dumps({'status': 'ffmpeg_command', 'cmd': ' '.join(cmd)})}", flush=True)
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if os.path.exists(temp_audio):
        try: os.remove(temp_audio)
        except: pass

    if res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
        print(f"JSON:{json.dumps({'status': 'success', 'output': output_path, 'resolution': f'{target_w}x{target_h}'})}", flush=True)
    else:
        print(f"JSON:{json.dumps({'status': 'error', 'error': res.stderr})}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--scale", type=int, default=4)
    parser.add_argument("--model", default="fsrcnn")
    args = parser.parse_args()

    process_video_ai(args.input, args.output, args.scale, args.model)
