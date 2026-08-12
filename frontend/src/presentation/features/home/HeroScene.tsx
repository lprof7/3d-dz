import { useState } from 'react';
import UnicornScene from 'unicornstudio-react';

const HERO_PROJECT_ID = 'oD2QBKj4GohsZCiJ4IWx';

export default function HeroScene() {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <UnicornScene
      projectId={HERO_PROJECT_ID}
      width="100%"
      height="100%"
      lazyLoad={false}
      production
      altText="Animated 3D background"
      ariaLabel="Animated 3D background"
      onError={() => setFailed(true)}
      showPlaceholderOnError={false}
      showPlaceholderWhileLoading={false}
    />
  );
}
