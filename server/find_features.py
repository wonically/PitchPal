#!/usr/bin/env python3

import opensmile
import sys

def find_features(file_path, search_terms):
    try:
        print(f"Finding features in: {file_path}")
        
        # Initialize openSMILE with ComParE feature set
        smile = opensmile.Smile(
            feature_set=opensmile.FeatureSet.ComParE_2016,
            feature_level=opensmile.FeatureLevel.Functionals,
        )
        
        # Extract features
        features = smile.process_file(file_path)
        feature_dict = features.to_dict('records')[0] if not features.empty else {}
        
        print(f"Total features: {len(feature_dict)}")
        
        for search_term in search_terms:
            print(f"\n=== Features containing '{search_term}' ===")
            matches = []
            for key, value in feature_dict.items():
                if search_term.lower() in key.lower():
                    matches.append((key, value))
            
            if matches:
                for key, value in matches[:10]:  # Show first 10 matches
                    print(f"  {key}: {value}")
                if len(matches) > 10:
                    print(f"  ... and {len(matches) - 10} more")
            else:
                print(f"  No features found containing '{search_term}'")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 find_features.py <audio_file>")
        sys.exit(1)
    
    search_terms = ["f0", "pitch", "jitter", "loudness", "hnr", "shimmer", "spectral", "energy"]
    find_features(sys.argv[1], search_terms)
