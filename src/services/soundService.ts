import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// Sound file paths (you'll need to add actual sound files to assets)
// For now, we'll use system sounds and haptics
const SOUNDS = {
  questCreated: null, // Will use haptic + system sound
  questStarted: null,
  questCompleted: null,
  messageReceived: null,
  messageSent: null,
  notificationReceived: null,
};

let soundCache: { [key: string]: Audio.Sound | null } = {};

/**
 * Initialize sound service
 */
export async function initializeSounds() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.log("Sound initialization error:", error);
  }
}

/**
 * Play a gaming sound effect
 */
export async function playSound(
  soundType: "questCreated" | "questStarted" | "questCompleted" | "messageReceived" | "messageSent" | "notificationReceived"
) {
  try {
    // Haptic feedback
    switch (soundType) {
      case "questCreated":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "questStarted":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "questCompleted":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "messageReceived":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "messageSent":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "notificationReceived":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }

    // TODO: Load and play actual sound files when available
    // For now, we rely on haptics for feedback
    // Example:
    // if (!soundCache[soundType]) {
    //   const { sound } = await Audio.Sound.createAsync(
    //     require('@/assets/sounds/quest-created.mp3')
    //   );
    //   soundCache[soundType] = sound;
    // }
    // await soundCache[soundType]?.replayAsync();
  } catch (error) {
    console.log("Error playing sound:", error);
  }
}

/**
 * Cleanup sounds
 */
export async function cleanupSounds() {
  for (const sound of Object.values(soundCache)) {
    if (sound) {
      await sound.unloadAsync();
    }
  }
  soundCache = {};
}

