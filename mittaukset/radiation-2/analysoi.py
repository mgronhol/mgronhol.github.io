#!/usr/bin/env python

import sys

baseline = 1650

data = []
with open( sys.argv[1], 'r' ) as handle:
	for line in handle:
		line = line.strip()
		if len( line ) > 0:
			parts = line.split()
			height = int(parts[1]) - baseline
			data.append( height )


data.sort()

width = 10

bins = [0] * 165


for i in range( len(bins) ):
	bin_start = i*width
	bin_stop = (i+1)*width
	
	for point in data:
		if point > bin_start and point <= bin_stop:
			bins[i] += 1


for i in range( len(bins) ):
	bin_start = i*width
	print bin_start, bins[i]
