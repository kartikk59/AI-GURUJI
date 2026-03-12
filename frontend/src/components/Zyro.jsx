import * as THREE from 'three'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { Lipsync } from 'wawa-lipsync'

export function Zyro({ audio, playTick, isSpeaking, ...props }) {
  const group = useRef(null)

  // Avatar model
  const { scene } = useGLTF('/models/Zyro.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)

  // Fix transparent eyes issue and change clothes colors
  useEffect(() => {
    if (nodes.EyeLeft?.material) {
      nodes.EyeLeft.material.transparent = false;
      nodes.EyeLeft.material.depthWrite = true;
    }
    if (nodes.EyeRight?.material) {
      nodes.EyeRight.material.transparent = false;
      nodes.EyeRight.material.depthWrite = true;
    }
    // Fallback global fix on the dictionary just in case
    if (materials?.Wolf3D_Eye) {
      materials.Wolf3D_Eye.transparent = false;
      materials.Wolf3D_Eye.depthWrite = true;
    }

    // Change clothes based on request: white t-shirt, blue jacket, black (blant) pants
    if (materials?.Wolf3D_Outfit_Top) {
      // Tint top to blue. Without custom textures, this gives the overall jacket a blue tint.
      // If the texture has a bright t-shirt area, it might become light blue.
      materials.Wolf3D_Outfit_Top.color = new THREE.Color("#1e40af");
    }
    if (materials?.Wolf3D_Outfit_Bottom) {
      materials.Wolf3D_Outfit_Bottom.color = new THREE.Color("#111111"); // Black pants
    }
    if (materials?.Wolf3D_Outfit_Footwear) {
      materials.Wolf3D_Outfit_Footwear.color = new THREE.Color("#222222"); // Dark shoes to match
    }

    console.log("== ZYRO MATERIALS DEBUG ==");
    console.log(materials);
    console.log("==========================");
  }, [nodes, materials]);

  // Animations (Idle, etc.)
  const { animations: clips } = useGLTF('/models/Animations.glb')

  useMemo(() => {
    if (!clips) return

    clips.forEach((clip) => {
      if (!clip.tracks) return

      // Filter out problematic tracks and rename bones from Mixamo
      clip.tracks = clip.tracks.filter((track) => {
        const name = track.name.toLowerCase()
        return !name.includes('end') && !name.includes('nub') && !name.includes('armature') && !name.includes('morph') && !name.includes('blendshape')
      })

      clip.tracks.forEach((track) => {
        track.name = track.name.replace('mixamorig', '')
      })
    })
  }, [clips])

  const { actions, names } = useAnimations(clips || [], group)

  const [currentAnim, setCurrentAnim] = useState('idle');
  const [hasGreeted, setHasGreeted] = useState(false);

  // Determine which animation state to be in based on isSpeaking
  useEffect(() => {
    let timeoutId;
    let intervalId;

    if (isSpeaking) {
      if (!hasGreeted) {
        setCurrentAnim('greeting');
        setHasGreeted(true);
        timeoutId = setTimeout(() => {
          setCurrentAnim('talking');
        }, 2800); // Switch to talking after 2.8s of greeting
      } else {
        setCurrentAnim('talking');
      }
    } else {
      const pausedAnims = ['happy', 'idle', 'look around'];
      setCurrentAnim(pausedAnims[Math.floor(Math.random() * pausedAnims.length)]);

      // Randomly cycle through idle animations when paused
      intervalId = setInterval(() => {
        setCurrentAnim(pausedAnims[Math.floor(Math.random() * pausedAnims.length)]);
      }, 5000);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    }
  }, [isSpeaking, hasGreeted]);

  // Execute the active animation
  useEffect(() => {
    if (!names || names.length === 0) return;

    // Helper to find exact or similar clip matching our state keyword
    const findClipName = (keyword) => {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '');
      return names.find(n => n.toLowerCase().replace(/\s+/g, '').includes(normalizedKeyword));
    };

    let clipName = findClipName(currentAnim);

    // Fallbacks just in case the GLB names are slightly different
    if (!clipName && currentAnim === 'talking') clipName = findClipName('talk');
    if (!clipName && currentAnim === 'greeting') clipName = findClipName('greet');
    if (!clipName && currentAnim === 'look around') clipName = findClipName('look');

    // Default fallback
    if (!clipName) clipName = findClipName('idle') || names[0];

    if (!clipName || !actions[clipName]) return;

    const action = actions[clipName];
    action.reset().fadeIn(0.5).play();
    action.setLoop(THREE.LoopRepeat, Infinity);

    return () => {
      action.fadeOut(0.5);
    }
  }, [currentAnim, actions, names])

  // Lipsync setup using shared Audio element from Show
  const lipsyncRef = useRef(null)


  useEffect(() => {
    if (!audio) return

    if (!window.__sharedLipsyncMap) {
      window.__sharedLipsyncMap = new WeakMap();
    }
    
    // Initialize lipsync instance if needed
    if (!window.__sharedLipsyncMap.has(audio)) {
      window.__sharedLipsyncMap.set(audio, new Lipsync());
    }
    lipsyncRef.current = window.__sharedLipsyncMap.get(audio);

    const lipsync = lipsyncRef.current;

    // Resume context if suspended (common browser policy)
    if (lipsync.audioContext && lipsync.audioContext.state === 'suspended') {
      lipsync.audioContext.resume();
    }

    // Connect the new audio element
    try {
      // Some browsers throw if we connect the same element twice, so we wrap in try/catch or check state
      // The library 'connectAudio' typically handles creating the source.
      lipsync.connectAudio(audio)
    } catch (e) {
      console.warn("Lipsync connection warning:", e);
    }

    return () => {
      // Lipsync library handles cleanup internally; nothing special here
    }
  }, [audio, playTick])

  // Simple blinking
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    let timeout
    const loop = () => {
      timeout = setTimeout(() => {
        setBlink(true)
        setTimeout(() => {
          setBlink(false)
          loop()
        }, 150)
      }, THREE.MathUtils.randInt(1200, 4000))
    }
    loop()
    return () => clearTimeout(timeout)
  }, [])

  // Drive morph targets for visemes + blinking each frame
  useFrame(() => {
    const lipsync = lipsyncRef.current
    const head = nodes.Wolf3D_Head
    const teeth = nodes.Wolf3D_Teeth

    if (!head || !teeth || !lipsync || !audio) return

    const audioPlaying = !audio.paused && !audio.ended && isSpeaking

    if (audioPlaying) {
      lipsync.processAudio()
    }

    const currentViseme = lipsync.viseme

    Object.keys(head.morphTargetDictionary || {}).forEach((key) => {
      const headIndex = head.morphTargetDictionary[key]
      const teethIndex = teeth.morphTargetDictionary[key]
      if (headIndex === undefined) return

      let targetValue = 0

      // Blinking
      if (key === 'eyeBlinkLeft' || key === 'eyeBlinkRight') {
        targetValue = blink ? 1 : 0
      }

      // Viseme-based mouth shapes while audio is playing
      if (audioPlaying && key.startsWith('viseme_')) {
        if (key === currentViseme) {
          targetValue = 1.0
        }
      }

      const lerpSpeed = audioPlaying && key.startsWith('viseme_') ? 0.5 : 0.25

      head.morphTargetInfluences[headIndex] = THREE.MathUtils.lerp(
        head.morphTargetInfluences[headIndex] || 0,
        targetValue,
        lerpSpeed
      )

      if (teethIndex !== undefined) {
        teeth.morphTargetInfluences[teethIndex] = THREE.MathUtils.lerp(
          teeth.morphTargetInfluences[teethIndex] || 0,
          targetValue,
          lerpSpeed
        )
      }
    })
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  )
}

useGLTF.preload('/models/Zyro.glb')
useGLTF.preload('/models/Animations.glb')
