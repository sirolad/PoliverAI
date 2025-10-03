## Placeholder CMake for react-native-worklets codegen
# Create a small STATIC target with an empty source so React Native's autolinking
# can safely call target_link_libraries(<app> react_codegen_rnworklets).
add_library(react_codegen_rnworklets STATIC empty.cpp)
set_target_properties(react_codegen_rnworklets PROPERTIES
    LINKER_LANGUAGE CXX
    POSITION_INDEPENDENT_CODE ON
)
target_include_directories(react_codegen_rnworklets PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
