# react-native-confetti-explosion

A lightweight, performant confetti explosion component for React Native. Pieces burst from a point with realistic drag, gravity, and rotation — all animated on the UI thread via [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) worklets.

## Features

- Physics-based animation with drag, gravity, and rotation
- Runs entirely on the UI thread (no JS thread blocking)
- Mix in emoji alongside confetti shapes
- Fully customizable colors, shapes, physics, and origin point
- `onComplete` callback for cleanup/navigation after the animation

## Installation

```sh
npm install react-native-confetti-explosion
# or
yarn add react-native-confetti-explosion
# or
bun add react-native-confetti-explosion
```

### Peer dependencies

This library requires the following peer dependencies:

```sh
npm install react-native-reanimated react-native-worklets
# or
yarn add react-native-reanimated react-native-worklets
# or
bun add react-native-reanimated react-native-worklets
```

Make sure the [Reanimated babel plugin](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/#step-2-add-reanimateds-babel-plugin) is configured in your `babel.config.js`:

```js
module.exports = {
  presets: ['babel-preset-expo'], // or your preset
  plugins: ['react-native-reanimated/plugin'],
};
```

## Usage

### Basic

```tsx
import { ConfettiExplosion } from 'react-native-confetti-explosion';

function MyScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* your content */}
      <ConfettiExplosion />
    </View>
  );
}
```

### With emoji

```tsx
<ConfettiExplosion emoji="🎉" emojiFrequency={0.4} />
```

### Custom colors and shapes

```tsx
import {
  ConfettiExplosion,
  DEFAULT_CONFETTI_COLORS,
} from 'react-native-confetti-explosion';

<ConfettiExplosion
  colors={[...DEFAULT_CONFETTI_COLORS, '#FF9800']}
  shapes={['★', '●', '▲']}
/>
```

### Triggered on demand

```tsx
function CelebrationScreen() {
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Button title="Celebrate!" onPress={() => setShowConfetti(true)} />
      {showConfetti && (
        <ConfettiExplosion onComplete={() => setShowConfetti(false)} />
      )}
    </View>
  );
}
```

### Custom origin point

```tsx
// Explode from the top-center of the container
<ConfettiExplosion origin={{ x: 200, y: 0 }} />
```

### Tuning the physics

```tsx
// Wider, floatier explosion
<ConfettiExplosion
  drag={0.3}
  gravity={200}
  launchForce={6000}
  explosionRadius={1200}
/>

// Tight, snappy burst
<ConfettiExplosion
  drag={1.0}
  gravity={600}
  launchForce={3000}
  explosionRadius={400}
  duration={2000}
/>
```

## Props

All props are optional.

| Prop | Type | Default | Description |
|---|---|---|---|
| `pieceCount` | `number` | `100` | Number of confetti pieces to render |
| `duration` | `number` | `5000` | Animation duration in milliseconds |
| `colors` | `string[]` | Built-in 6-color palette | Array of color hex strings |
| `shapes` | `string[]` | `['▬', '▰', '♥']` | Array of characters used as confetti shapes |
| `emoji` | `string` | — | Emoji character to mix into confetti pieces |
| `emojiFrequency` | `number` | `0.3` | Probability (0-1) that a piece is the emoji instead of a shape |
| `origin` | `{ x: number; y: number }` | Bottom-center of container | Explosion origin point in pixels |
| `pieceSize` | `number` | `14` | Base font size for confetti pieces |
| `explosionRadius` | `number` | `850` | Max distance a piece can travel in pixels |
| `drag` | `number` | `0.6` | Air resistance — higher values slow pieces faster, lower values let them spread further |
| `gravity` | `number` | `400` | Gravity strength pulling pieces downward |
| `launchForce` | `number` | `4500` | Upward launch force — higher values send pieces higher before falling |
| `onComplete` | `() => void` | — | Called when the animation finishes (after `duration` ms) |

## Exports

```tsx
import {
  ConfettiExplosion,        // The component
  DEFAULT_CONFETTI_COLORS,  // ['#FF5252', '#FFD740', '#40C4FF', '#69F0AE', '#FF4081', '#7C4DFF']
  DEFAULT_CONFETTI_SHAPES,  // ['▬', '▰', '♥']
} from 'react-native-confetti-explosion';

// Also exports the props type
import type { ConfettiExplosionProps } from 'react-native-confetti-explosion';
```

## How it works

Each confetti piece is pre-computed on the JS thread (angle, drag coefficient, gravity multiplier, etc.) and then animated entirely on the UI thread using Reanimated worklets. The physics model uses exponential drag for horizontal movement and a terminal velocity model for gravity, producing a natural arc-and-fall effect without any per-frame JS thread work.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
