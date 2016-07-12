#!/usr/bin/env python

import serial
import time
import sys

com = serial.Serial( "COM4", 115200, timeout = 0.1 )


t0 = time.time()
cnt = 0
try:
	while True:
		line = com.read(128)
		if len(line) > 0:
			try:
				value = int(line)
				print time.time() - t0, value
				print >>sys.stderr, time.time() - t0, value, cnt
				cnt += 1
			except ValueError:
				pass
except KeyboardInterrupt:
	pass

com.close()
