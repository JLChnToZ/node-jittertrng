{
  "targets": [
    {
      "target_name": "jittertrng-native",
      "sources": [ "src/native-bindings.cc", "deps/jitterentropy-library/jitterentropy-base.c" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
      "conditions": [
        ["OS==\"win\"", {
          "configuration": {
            "Release": { "msvs_settings": { "VCCLCompilerTool": { "Optimization": 0 } } }
          }
        }]
      ]
    }
  ]
}