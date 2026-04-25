import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Mock SplitText to avoid GSAP Business dependency while maintaining
 * compatibility with the exact React Bits logic.
 */
class GSAPSplitText {
  constructor(el, options) {
    this.el = el;
    this.chars = [];
    const source = el.querySelector('.shuffle-source');
    const text = source ? source.textContent : el.textContent;

    // Clear everything EXCEPT the source
    Array.from(el.childNodes).forEach(node => {
      if (node !== source) el.removeChild(node);
    });

    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = options.charsClass || '';
      span.style.display = 'inline-block';
      el.appendChild(span);
      this.chars.push(span);
    });
  }
  revert() {
    const source = this.el.querySelector('.shuffle-source');
    Array.from(this.el.childNodes).forEach(node => {
      if (node !== source) this.el.removeChild(node);
    });
  }
}

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Shuffle = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true
}) => {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  const splitRef = useRef(null);
  const wrappersRef = useRef([]);
  const tlRef = useRef(null);
  const playingRef = useRef(false);

  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') setFontsLoaded(true);
      else document.fonts.ready.then(() => setFontsLoaded(true));
    } else setFontsLoaded(true);
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;

      const el = ref.current;
      const computedFont = style.fontFamily || getComputedStyle(el).fontFamily || "'Outfit', sans-serif";

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        wrappersRef.current = [];
        playingRef.current = false;
        if (splitRef.current) {
          try { splitRef.current.revert(); } catch (e) { }
          splitRef.current = null;
        }
      };

      const build = () => {
        teardown();
        splitRef.current = new GSAPSplitText(el, { charsClass: 'shuffle-char' });
        const chars = splitRef.current.chars || [];

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = () => scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));

        chars.forEach(ch => {
          const w = ch.offsetWidth;
          const h = ch.offsetHeight;
          if (!w) return;

          const wrap = document.createElement('span');
          wrap.style.cssText = `
            display: inline-block;
            overflow: hidden;
            vertical-align: bottom;
            position: relative;
            width: ${w}px;
            height: ${shuffleDirection === 'up' || shuffleDirection === 'down' ? h + 'px' : h + 'px'};
          `;

          const inner = document.createElement('span');
          inner.style.cssText = `
            display: inline-block;
            white-space: nowrap;
            will-change: transform;
            position: absolute;
            top: 0;
            left: 0;
          `;

          ch.parentNode.replaceChild(wrap, ch);
          wrap.appendChild(inner);

          // Add original and random clones
          const orig = ch.cloneNode(true);
          orig.setAttribute('data-orig', '1');
          orig.style.fontFamily = computedFont;
          inner.appendChild(orig);

          for (let k = 0; k < rolls; k++) {
            const c = ch.cloneNode(true);
            if (scrambleCharset) c.textContent = rand();
            c.style.fontFamily = computedFont;
            inner.appendChild(c);
          }

          const final = ch.cloneNode(true);
          final.style.fontFamily = computedFont;
          inner.appendChild(final);

          const steps = rolls + 1;
          let startX = 0, finalX = 0, startY = 0, finalY = 0;

          if (shuffleDirection === 'right') { startX = -steps * w; finalX = 0; }
          else if (shuffleDirection === 'left') { startX = 0; finalX = -steps * w; }

          gsap.set(inner, { x: startX, y: 0 });
          inner.setAttribute('data-final-x', finalX);

          if (colorFrom) inner.style.color = colorFrom;
          wrappersRef.current.push(inner);
        });
      };

      const play = () => {
        if (!wrappersRef.current.length) return;
        const tl = gsap.timeline({
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onComplete: () => {
            playingRef.current = false;
            if (colorTo) gsap.set(wrappersRef.current, { color: colorTo });
            onShuffleComplete?.();
          }
        });

        wrappersRef.current.forEach((inner, i) => {
          const delay = animationMode === 'evenodd' ? (i % 2 === 0 ? 0 : stagger) : Math.random() * maxDelay;
          tl.to(inner, {
            x: parseFloat(inner.getAttribute('data-final-x')),
            duration,
            ease,
          }, delay);
        });
        tlRef.current = tl;
      };

      const timer = setTimeout(() => {
        build();
        play();
        setReady(true);
      }, 50);

      return () => {
        clearTimeout(timer);
        teardown();
      };
    },
    { dependencies: [text, fontsLoaded], scope: ref }
  );

  const Tag = tag || 'p';
  return (
    <Tag
      ref={ref}
      className={`shuffle-parent ${ready ? 'is-ready' : ''} ${className}`}
      style={{
        textAlign,
        display: 'inline-block',
        position: 'relative',
        ...style
      }}
    >
      <span className="shuffle-source" style={{ display: 'none' }}>{text}</span>
      {/* The animation spans will be injected here by build() */}
    </Tag>
  );
};

export default Shuffle;
