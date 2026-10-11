#!/bin/bash
echo "Solve my forms builder"
echo "By @Kitki30"

# Include license file inside final build
cp ./LICENSE ./src/LICENSE

# Zip it
cd src
zip -r ../extension.xpi ./*

# Done
echo "Done"