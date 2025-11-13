import React from "react";
import { View, Text, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Video, Users } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  age: number | null;
  photos: string[];
  location: string | null;
  isLive: boolean;
  liveViewers: number;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void; // Yes
  onSwipeRight: () => void; // No
  isTop?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  isTop = true,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      // Swipe right = No
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, {}, () => {
          runOnJS(onSwipeRight)();
        });
      }
      // Swipe left = Yes
      else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {}, () => {
          runOnJS(onSwipeLeft)();
        });
      }
      // Return to center
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-30, 0, 30]);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: isTop ? 1 : 0.8,
    };
  });

  const yesOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SCREEN_WIDTH, -50, 0], [1, 0.7, 0]);
    return { opacity };
  });

  const noOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, 50, SCREEN_WIDTH], [0, 0.7, 1]);
    return { opacity };
  });

  const imageUrl = profile.photos[0] || "https://via.placeholder.com/400x600/5E1FA8/ffffff?text=No+Photo";

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: SCREEN_WIDTH - 40,
            height: SCREEN_HEIGHT * 0.7,
            borderRadius: 24,
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        {/* Card Background */}
        <View className="flex-1">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* Glass overlay gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "50%",
            }}
          />

          {/* Yes Overlay (Left swipe) */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 60,
                right: 40,
                backgroundColor: "rgba(0, 217, 255, 0.9)",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: "#00D9FF",
              },
              yesOverlayStyle,
            ]}
          >
            <Text className="text-white text-2xl font-bold">YES ✓</Text>
          </Animated.View>

          {/* No Overlay (Right swipe) */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 60,
                left: 40,
                backgroundColor: "rgba(126, 63, 228, 0.9)",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: "#7E3FE4",
              },
              noOverlayStyle,
            ]}
          >
            <Text className="text-white text-2xl font-bold">NO ✗</Text>
          </Animated.View>

          {/* Live Indicator */}
          {profile.isLive && (
            <View className="absolute top-6 left-6 flex-row items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full">
              <Video size={16} color="#fff" />
              <Text className="text-white text-sm font-bold">LIVE</Text>
              <Users size={14} color="#fff" />
              <Text className="text-white text-xs">{profile.liveViewers}</Text>
            </View>
          )}

          {/* Profile Info */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <View className="flex-row items-end gap-2">
              <Text className="text-white text-4xl font-bold">{profile.displayName}</Text>
              {profile.age && <Text className="text-white/90 text-3xl font-light">{profile.age}</Text>}
            </View>

            {profile.bio && (
              <Text className="text-white/90 text-base mt-2" numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            {profile.location && (
              <Text className="text-white/70 text-sm mt-2">📍 {profile.location}</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};
