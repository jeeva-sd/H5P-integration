#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}H5P Library Installation Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Install libraries via the H5P server endpoint
install_library() {
    local machine_name=$1
    echo -e "${YELLOW}Installing ${machine_name}...${NC}"
    
    response=$(curl -s -X POST "http://localhost:4000/h5p/ajax?action=library-install&id=${machine_name}" \
        -H "x-user-id: teacher")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Successfully installed ${machine_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to install ${machine_name}${NC}"
        echo "   Response: $response"
        return 1
    fi
}

# Check if server is running
echo -e "${BLUE}Checking if backend server is running...${NC}"
if ! curl -s http://localhost:4000/api/info > /dev/null; then
    echo -e "${RED}❌ Backend server is not running on port 4000${NC}"
    echo -e "${YELLOW}Please start the server first: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}\n"

# List of popular H5P content types to install
libraries=(
    "H5P.Accordion"
    "H5P.MultiChoice"
    "H5P.TrueFalse"
    "H5P.DragText"
    "H5P.MarkTheWords"
    "H5P.Blanks"
    "H5P.ImageHotspots"
    "H5P.InteractiveVideo"
    "H5P.CoursePresentation"
    "H5P.Timeline"
    "H5P.ImageSlider"
    "H5P.Summary"
)

echo -e "${BLUE}Installing ${#libraries[@]} popular H5P libraries...${NC}\n"

success_count=0
fail_count=0

for lib in "${libraries[@]}"; do
    if install_library "$lib"; then
        ((success_count++))
    else
        ((fail_count++))
    fi
    sleep 1
done

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Installation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Successful: ${success_count}${NC}"
echo -e "${RED}Failed: ${fail_count}${NC}"
echo -e "${BLUE}========================================${NC}\n"

if [ $fail_count -gt 0 ]; then
    echo -e "${YELLOW}Note: Some libraries may have failed due to dependencies.${NC}"
    echo -e "${YELLOW}You can install more libraries from the H5P Hub in the editor UI.${NC}"
fi

echo -e "\n${GREEN}✅ Installation complete!${NC}"
echo -e "${BLUE}You can now use these content types in your H5P editor.${NC}\n"
