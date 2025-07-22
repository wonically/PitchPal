#!/usr/bin/env python3

import opensmile
import sys

def test_opensmile(file_path):
    try:
        print(f"Testing OpenSMILE with: {file_path}")
        
        # Initialize openSMILE with ComParE feature set
        smile = opensmile.Smile(
            feature_set=opensmile.FeatureSet.ComParE_2016,
            feature_level=opensmile.FeatureLevel.Functionals,
        )
        
        print("OpenSMILE initialized successfully")
        
        # Extract features
        features = smile.process_file(file_path)
        print(f"Features extracted: {features.shape}")
        
        # Convert to dict for easier handling
        feature_dict = features.to_dict('records')[0] if not features.empty else {}
        print(f"Number of features: {len(feature_dict)}")
        
        # Check for specific features we need
        key_features = [
            "F0semitoneFrom27.5Hz_sma3nz_amean",
            "F0semitoneFrom27.5Hz_sma3nz_stddevNorm", 
            "loudness_sma3_amean",
            "jitterLocal_sma3nz_amean",
            "HNRdBACF_sma3nz_amean"
        ]
        
        print("\nKey feature values:")
        for feature in key_features:
            value = feature_dict.get(feature, "NOT_FOUND")
            print(f"  {feature}: {value}")
            
        # Print first 10 features to see what we have
        print(f"\nFirst 10 features:")
        for i, (key, value) in enumerate(feature_dict.items()):
            if i >= 10:
                break
            print(f"  {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"OpenSMILE test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 test_opensmile.py <audio_file>")
        sys.exit(1)
    
    test_opensmile(sys.argv[1])
