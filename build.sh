#!/bin/bash
echo "Solve my forms builder"
echo "By @Kitki30"

# Include license file inside final build
cp ./LICENSE ./src/LICENSE

# Zip it
zip -r ./extension.xpi ./src/*

# Done
echo "Done"