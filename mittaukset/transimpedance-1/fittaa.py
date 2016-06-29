#!/usr/bin/env python

import numpy as np

import sys

data = []
with open( sys.argv[1], 'r' ) as handle:
	for line in handle:
		line = line.strip()
		if len( line ) > 0:
			parts = line.split()
			data.append([float(p) for p in parts])


print np.polyfit( [d[1]*1e-10 for d in data], [d[0] for d in data], 1 )
