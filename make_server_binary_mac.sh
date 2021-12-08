#!/bin/bash
source "$(pwd)/venv/bin/activate"

pyinstaller -D --paths ./venv/lib/python3.7/site-packages --add-data basic_emotions.onnx:. --add-data model.onnx:. --add-data ./venv/lib/python3.7/site-packages/mediapipe/modules/face_detection/face_detection_full_range_cpu.binarypb:./mediapipe/modules/face_detection --add-data ./venv/lib/python3.7/site-packages/mediapipe/modules/:./mediapipe/modules ws_server.py

deactivate
