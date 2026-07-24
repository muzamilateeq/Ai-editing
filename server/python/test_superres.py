import cv2
import numpy as np
import sys
import os

print("OpenCV Version:", cv2.__version__)
try:
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    print("OpenCV DNN Super-Resolution module available!")
except Exception as e:
    print("DNN Super-Resolution error:", e)
