import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

// Pre-computed physics config to avoid worklet overhead
interface ExplosionPieceConfig {
  size: number;
  shape: string;
  color: string;
  delay: number;
  duration: number;
  rotationSpeed: number;
  // Pre-computed physics values (avoid trig in worklet)
  cosAngle: number;
  sinAngle: number;
  explosionDistance: number;
  gravityMultiplier: number;
  drag: number;
  upwardBiasMultiplier: number;
  // Pre-computed derived values
  kX: number;
  kGravity: number;
  upwardBias: number;
  gravity: number;
}

function ExplosionConfettiPiece({
  config,
  width,
  height,
  origin = { x: width / 2, y: height },
}: {
  config: ExplosionPieceConfig;
  width: number;
  height: number;
  origin?: { x: number; y: number }; // default: bottom-center
}) {
  // Start animation immediately with delay handled by Reanimated (UI thread)
  const animation = useSharedValue(0);

  // Initialize animation on first render - withDelay keeps it on UI thread
  if (animation.value === 0) {
    animation.value = withDelay(
      config.delay,
      withTiming(4, {
        duration: config.duration,
        easing: Easing.linear,
      })
    );
  }

  // Pre-extract config values to avoid repeated property access in worklet
  const {
    cosAngle,
    sinAngle,
    explosionDistance,
    kX,
    kGravity,
    upwardBias,
    gravity,
    rotationSpeed,
  } = config;

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = animation.value;

    // Position with drag: x(t) = (v0/k) * (1 - e^(-k*t))
    const horizontalPositionFactor = (1 - Math.exp(-kX * progress)) / kX;

    const outwardX = cosAngle * explosionDistance * horizontalPositionFactor;

    // Initial explosion velocities
    const baseY = sinAngle * explosionDistance * horizontalPositionFactor;
    const upwardVelocity = upwardBias * horizontalPositionFactor;

    // Terminal velocity model for gravity
    const terminalVelocityFactor =
      (1 / (kGravity * kGravity)) *
      (kGravity * progress - 1 + Math.exp(-kGravity * progress));
    const gravityEffect = gravity * terminalVelocityFactor * 4;

    const outwardY = baseY + upwardVelocity + gravityEffect;
    const rotate = progress * rotationSpeed * 2;

    // Fade out during the last portion
    const opacity = interpolate(progress, [3.2, 4], [1, 0], 'clamp');

    return {
      opacity,
      transform: [
        { translateX: outwardX },
        { translateY: outwardY },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.piece,
        {
          fontSize: config.size,
          color: config.color,
          left: origin.x,
          top: origin.y,
        },
        animatedStyle,
      ]}
    >
      {config.shape}
    </Animated.Text>
  );
}

export interface ConfettiExplosionProps {
  /** Pieces to render (default: 100) */
  pieceCount?: number;
  /** Animation duration in ms (default: 5000) */
  duration?: number;
  /** Confetti colors (default: built-in palette) */
  colors?: string[];
  /** Confetti shapes (default: ['▬', '▰', '♥']) */
  shapes?: string[];
  /** Optional emoji mixed into pieces */
  emoji?: string;
  /** Probability of emoji vs shape, 0–1 (default: 0.3) */
  emojiFrequency?: number;
  /** Explosion origin point (default: bottom-center of container) */
  origin?: { x: number; y: number };
  /** Base font size for confetti pieces (default: 14) */
  pieceSize?: number;
  /** Max explosion distance in px (default: 850) */
  explosionRadius?: number;
  /** Air resistance — higher values slow pieces faster, lower values let them travel further (default: 0.6) */
  drag?: number;
  /** Gravity strength pulling pieces down (default: 400) */
  gravity?: number;
  /** Upward launch force (default: 4500) */
  launchForce?: number;
  /** Called when all pieces have finished animating */
  onComplete?: () => void;
}

export const DEFAULT_CONFETTI_COLORS = [
  '#FF5252',
  '#FFD740',
  '#40C4FF',
  '#69F0AE',
  '#FF4081',
  '#7C4DFF',
];

export const DEFAULT_CONFETTI_SHAPES = ['▬', '▰', '♥'];

export function ConfettiExplosion({
  pieceCount = 100,
  duration = 5000,
  colors = DEFAULT_CONFETTI_COLORS,
  shapes = DEFAULT_CONFETTI_SHAPES,
  emoji,
  emojiFrequency = 0.3,
  pieceSize = 14,
  origin,
  explosionRadius = 850,
  drag: dragBase = 0.6,
  gravity: gravityBase = 400,
  launchForce = 4500,
  onComplete,
}: ConfettiExplosionProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const resolvedOrigin = origin ?? {
    x: layout.width / 2,
    y: layout.height,
  };

  const explosionConfigs = useMemo<ExplosionPieceConfig[]>(() => {
    const configs: ExplosionPieceConfig[] = [];
    const angleStep = pieceCount > 1 ? 180 / (pieceCount - 1) : 0;

    for (let index = 0; index < pieceCount; index++) {
      const baseAngle = 180 + index * angleStep;
      const angleRad = (baseAngle * Math.PI) / 180;
      const drag = dragBase + Math.random() * 0.7;
      const gravityMultiplier = 0.6 + Math.random() * 0.8;
      const upwardBiasMultiplier = 0.2 + Math.random() * 0.8;

      const useEmoji = emoji && Math.random() < emojiFrequency;
      const shapeIndex = Math.floor(Math.random() * shapes.length);
      const colorIndex = Math.floor(Math.random() * colors.length);
      const shape = useEmoji && emoji ? emoji : shapes[shapeIndex]!;
      const color = colors[colorIndex]!;

      configs.push({
        size: Math.random() * 6 + pieceSize,
        shape,
        color,
        delay: 0,
        duration,
        rotationSpeed: Math.random() * 180 + 90,
        cosAngle: Math.cos(angleRad),
        sinAngle: Math.sin(angleRad),
        explosionDistance: Math.random() * explosionRadius,
        gravityMultiplier,
        drag,
        upwardBiasMultiplier,
        kX: drag * 3,
        kGravity: Math.max(0.5, drag * 2),
        upwardBias: -launchForce * upwardBiasMultiplier,
        gravity: gravityBase * gravityMultiplier,
      });
    }

    return configs;
  }, [
    colors,
    dragBase,
    duration,
    emoji,
    emojiFrequency,
    gravityBase,
    launchForce,
    explosionRadius,
    pieceCount,
    pieceSize,
    shapes,
  ]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {layout.width > 0 &&
        layout.height > 0 &&
        explosionConfigs.map((config, index) => (
          <ExplosionConfettiPiece
            key={`explosion-${index}`}
            config={config}
            width={layout.width}
            height={layout.height}
            origin={resolvedOrigin}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
