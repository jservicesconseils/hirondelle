#!/bin/bash

# Script de build pour l'application mobile Roseed Hermon
# Usage: ./scripts/build-mobile.sh [android|ios|both]

set -e

echo "🚀 Build de l'application mobile Roseed Hermon"
echo "=============================================="

# Vérifier les arguments
PLATFORM=${1:-both}

# Fonction pour build Android
build_android() {
    echo "📱 Building for Android..."
    
    # Build Angular
    echo "🔨 Building Angular application..."
    ng build --configuration production
    
    # Sync avec Capacitor
    echo "🔄 Syncing with Capacitor..."
    npx cap sync android
    
    # Build Android
    echo "🏗️ Building Android APK..."
    npx cap build android
    
    echo "✅ Android build completed!"
    echo "📁 APK location: android/app/build/outputs/apk/"
}

# Fonction pour build iOS
build_ios() {
    echo "🍎 Building for iOS..."
    
    # Build Angular
    echo "🔨 Building Angular application..."
    ng build --configuration production
    
    # Sync avec Capacitor
    echo "🔄 Syncing with Capacitor..."
    npx cap sync ios
    
    # Build iOS
    echo "🏗️ Building iOS app..."
    npx cap build ios
    
    echo "✅ iOS build completed!"
    echo "📁 iOS project location: ios/App/"
}

# Fonction pour build les deux
build_both() {
    echo "🌍 Building for both platforms..."
    
    # Build Angular
    echo "🔨 Building Angular application..."
    ng build --configuration production
    
    # Sync avec Capacitor
    echo "🔄 Syncing with Capacitor..."
    npx cap sync
    
    echo "✅ Sync completed for both platforms!"
    echo "📱 Android: npx cap build android"
    echo "🍎 iOS: npx cap build ios"
}

# Exécuter selon la plateforme demandée
case $PLATFORM in
    android)
        build_android
        ;;
    ios)
        build_ios
        ;;
    both)
        build_both
        ;;
    *)
        echo "❌ Platform invalide: $PLATFORM"
        echo "Usage: $0 [android|ios|both]"
        exit 1
        ;;
esac

echo ""
echo "🎉 Build terminé avec succès!"
echo "📱 Pour tester sur un appareil: npx cap run $PLATFORM"
echo "🖥️ Pour ouvrir dans l'IDE: npx cap open $PLATFORM"