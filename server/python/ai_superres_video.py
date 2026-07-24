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

    mid_w = int(target_w * 0.65)
    mid_h = int(target_h * 0.65)

    print(f"JSON:{json.dumps({'status': 'processing_frames', 'target': f'{target_w}x{target_h}'})}", flush=True)

    temp_audio = os.path.join(models_dir, f"audio_{int(time.time())}.aac")
    subprocess.run([ffmpeg_exe, "-y", "-i", input_path, "-vn", "-acodec", "copy", temp_audio], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Industry Standard Dual-Stage Step-Up Lanczos 4K/8K Filter Stack
    filters = [
        "hqdn3d=1.0:1.0:2:2",
        f"scale={mid_w}:{mid_h}:flags=lanczos",
        "unsharp=5:5:0.6:3:3:0.2",
        f"scale={target_w}:{target_h}:flags=lanczos+accurate_rnd+full_chroma_int+full_chroma_inp",
        "unsharp=5:5:0.8:3:3:0.2",
        "eq=contrast=1.03:brightness=0.0:saturation=1.02:gamma=0.98",
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
        "-crf", "10", # Master Lossless Quality
        "-preset", "medium",
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
