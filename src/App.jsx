import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Globe,
  BookOpen,
  GraduationCap,
  Briefcase,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Volume2,
  Layers,
  Compass,
  Award,
  Calendar,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  X,
  Laptop,
  Building2,
  FileCheck,
  HelpCircle,
  Terminal,
  MessageSquare,
  Quote,
  Target,
  Eye,
  UserCheck,
  Bell,
  Menu,
  FileText
} from 'lucide-react';

/* ============================================================================
   SCROLL-LINKED SPRING & MOTION ENGINE (Framer Motion API Compatible)
   ============================================================================ */
function useScroll({ target } = {}) {
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    scrollYProgress: 0,
    targetProgress: 0,
  });

  useEffect(() => {
    let rafId = null;
    const updateScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const docHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const globalProgress = Math.min(Math.max(y / docHeight, 0), 1);

      let localProgress = globalProgress;
      if (target && target.current) {
        const rect = target.current.getBoundingClientRect();
        const total = rect.height + window.innerHeight;
        const passed = window.innerHeight - rect.top;
        localProgress = Math.min(Math.max(passed / Math.max(total, 1), 0), 1);
      }

      setScrollState({
        scrollY: y,
        scrollYProgress: target ? localProgress : globalProgress,
        targetProgress: localProgress,
      });
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScroll);
    };

    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target]);

  return scrollState;
}

function useSpring(value, { stiffness = 120, damping = 20 } = {}) {
  const [springVal, setSpringVal] = useState(value);
  const currentRef = useRef(value);
  const velocityRef = useRef(0);
  const targetRef = useRef(value);

  useEffect(() => {
    targetRef.current = value;
    let rafId = null;

    const step = () => {
      const diff = targetRef.current - currentRef.current;
      const springForce = diff * (stiffness / 1000);
      const dampingForce = velocityRef.current * (damping / 100);
      const acceleration = springForce - dampingForce;

      velocityRef.current += acceleration;
      currentRef.current += velocityRef.current;

      if (Math.abs(diff) > 0.0005 || Math.abs(velocityRef.current) > 0.0005) {
        setSpringVal(currentRef.current);
        rafId = requestAnimationFrame(step);
      } else {
        currentRef.current = targetRef.current;
        setSpringVal(targetRef.current);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, stiffness, damping]);

  return springVal;
}

function useTransform(value, inputRange, outputRange) {
  return useMemo(() => {
    if (!inputRange || !outputRange || inputRange.length < 2) return outputRange?.[0] ?? 0;
    const clamped = Math.min(
      Math.max(value, inputRange[0]),
      inputRange[inputRange.length - 1]
    );

    let i = 0;
    for (; i < inputRange.length - 2; i++) {
      if (clamped >= inputRange[i] && clamped <= inputRange[i + 1]) break;
    }

    const inMin = inputRange[i];
    const inMax = inputRange[i + 1];
    const outMin = outputRange[i];
    const outMax = outputRange[i + 1];
    const ratio = inMax === inMin ? 0 : (clamped - inMin) / (inMax - inMin);

    if (typeof outMin === 'number' && typeof outMax === 'number') {
      return outMin + ratio * (outMax - outMin);
    }
    if (typeof outMin === 'string' && typeof outMax === 'string') {
      const numMin = parseFloat(outMin);
      const numMax = parseFloat(outMax);
      const unit = outMin.replace(/[0-9.-]/g, '') || 'px';
      if (!Number.isNaN(numMin) && !Number.isNaN(numMax)) {
        return `${(numMin + ratio * (numMax - numMin)).toFixed(2)}${unit}`;
      }
    }
    return outMin;
  }, [value, inputRange, outputRange]);
}

function createMotionComponent(Tag) {
  return React.forwardRef(function MotionElement(
    {
      initial,
      animate,
      whileInView,
      whileHover,
      whileTap,
      viewport = { once: false, amount: 0.15 },
      transition = { duration: 0.7, delay: 0 },
      style = {},
      className = '',
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...rest
    },
    externalRef
  ) {
    const innerRef = useRef(null);
    const [inView, setInView] = useState(!whileInView);
    const [hovered, setHovered] = useState(false);
    const [tapped, setTapped] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      const timer = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(timer);
    }, []);

    useEffect(() => {
      if (!whileInView || !innerRef.current) return;
      const el = innerRef.current;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setInView(true);
            } else if (!viewport?.once) {
              setInView(false);
            }
          });
        },
        { threshold: viewport?.amount ?? 0.15, rootMargin: '0px 0px -30px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [whileInView, viewport?.once, viewport?.amount]);

    const activeState = useMemo(() => {
      let state = {};
      if (initial && !mounted && !whileInView) {
        state = { ...state, ...initial };
      } else if (whileInView) {
        state = inView ? { ...initial, ...whileInView } : { ...initial };
      } else if (animate) {
        state = mounted ? { ...initial, ...animate } : { ...initial };
      }
      if (hovered && whileHover) {
        state = { ...state, ...whileHover };
      }
      if (tapped && whileTap) {
        state = { ...state, ...whileTap };
      }
      return state;
    }, [initial, animate, whileInView, whileHover, whileTap, inView, hovered, tapped, mounted]);

    const computedStyle = useMemo(() => {
      const tx = activeState.x ?? style.x ?? 0;
      const ty = activeState.y ?? style.y ?? 0;
      const scale = activeState.scale ?? style.scale ?? 1;
      const rotate = activeState.rotate ?? style.rotate ?? 0;

      const xStr = typeof tx === 'number' ? `${tx}px` : tx;
      const yStr = typeof ty === 'number' ? `${ty}px` : ty;

      const transforms = [];
      if (tx !== 0 || ty !== 0) transforms.push(`translate3d(${xStr}, ${yStr}, 0)`);
      if (scale !== 1) transforms.push(`scale(${scale})`);
      if (rotate !== 0) transforms.push(`rotate(${rotate}deg)`);

      const dur = hovered || tapped ? 0.26 : transition?.duration ?? 0.7;
      const del = hovered || tapped ? 0 : transition?.delay ?? 0;

      const cleanStyle = { ...style };
      delete cleanStyle.x;
      delete cleanStyle.y;
      delete cleanStyle.scale;
      delete cleanStyle.rotate;

      return {
        ...cleanStyle,
        opacity: activeState.opacity !== undefined ? activeState.opacity : cleanStyle.opacity,
        transform: transforms.length > 0 ? transforms.join(' ') : cleanStyle.transform,
        transition: `transform ${dur}s cubic-bezier(0.16, 1, 0.3, 1) ${del}s, opacity ${dur}s cubic-bezier(0.16, 1, 0.3, 1) ${del}s, box-shadow 0.35s ease, border-color 0.35s ease`,
        willChange: 'transform, opacity',
      };
    }, [activeState, style, transition, hovered, tapped]);

    const setRefs = useCallback(
      (node) => {
        innerRef.current = node;
        if (typeof externalRef === 'function') externalRef(node);
        else if (externalRef) externalRef.current = node;
      },
      [externalRef]
    );

    return (
      <Tag
        ref={setRefs}
        className={className}
        style={computedStyle}
        onMouseEnter={(e) => {
          setHovered(true);
          if (onMouseEnter) onMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          setTapped(false);
          if (onMouseLeave) onMouseLeave(e);
        }}
        onMouseDown={(e) => {
          setTapped(true);
          if (onMouseDown) onMouseDown(e);
        }}
        onMouseUp={(e) => {
          setTapped(false);
          if (onMouseUp) onMouseUp(e);
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  });
}

const motion = {
  div: createMotionComponent('div'),
  section: createMotionComponent('section'),
  header: createMotionComponent('header'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  p: createMotionComponent('p'),
  span: createMotionComponent('span'),
  button: createMotionComponent('button'),
  a: createMotionComponent('a'),
  article: createMotionComponent('article'),
  footer: createMotionComponent('footer'),
};

/* ============================================================================
   WEBGL-INSPIRED INTERACTIVE SHADER / AURORA CANVAS BACKGROUND
   ============================================================================ */
function WebGLAuroraCanvas({ scrollProgress }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.3 });
  const scrollRef = useRef(0);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId = null;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX / Math.max(window.innerWidth, 1),
        y: e.clientY / Math.max(window.innerHeight, 1),
      };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const nodes = Array.from({ length: 32 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      vx: (((i % 5) - 2) * 0.00018) || 0.00015,
      vy: (((i % 7) - 3) * 0.00016) || -0.00012,
      radius: 1.2 + (i % 3) * 0.8,
      hueType: i % 3,
    }));

    const render = () => {
      time += 0.008;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const sp = scrollRef.current;

      ctx.clearRect(0, 0, w, h);

      const orbs = [
        {
          x: w * (0.2 + Math.sin(time * 0.7) * 0.1 + (mouseRef.current.x - 0.5) * 0.08),
          y: h * (0.25 + Math.cos(time * 0.5) * 0.1 - sp * 0.15),
          r: Math.max(w, h) * 0.42,
          color: 'rgba(220, 38, 38, 0.13)',
        },
        {
          x: w * (0.78 + Math.cos(time * 0.6) * 0.1 - (mouseRef.current.x - 0.5) * 0.08),
          y: h * (0.62 + Math.sin(time * 0.8) * 0.12 - sp * 0.1),
          r: Math.max(w, h) * 0.45,
          color: 'rgba(245, 158, 11, 0.12)',
        },
        {
          x: w * (0.5 + Math.sin(time * 0.4) * 0.15),
          y: h * (0.85 - sp * 0.35),
          r: Math.max(w, h) * 0.38,
          color: 'rgba(239, 68, 68, 0.08)',
        },
      ];

      orbs.forEach((orb) => {
        const grad = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.024)';
      ctx.lineWidth = 1;
      const gridSize = 90;
      const offsetY = (sp * 240) % gridSize;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -gridSize + offsetY; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      nodes.forEach((n, idx) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;

        const px = n.x * w;
        const py = ((n.y - sp * 0.25 + 1) % 1) * h;

        for (let j = idx + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const px2 = n2.x * w;
          const py2 = ((n2.y - sp * 0.25 + 1) % 1) * h;
          const dist = Math.hypot(px - px2, py - py2);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.13;
            ctx.strokeStyle =
              n.hueType === 1
                ? `rgba(239, 68, 68, ${alpha})`
                : n.hueType === 2
                ? `rgba(245, 158, 11, ${alpha})`
                : `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px2, py2);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(px, py, n.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          n.hueType === 1
            ? 'rgba(239, 68, 68, 0.55)'
            : n.hueType === 2
            ? 'rgba(251, 191, 36, 0.6)'
            : 'rgba(226, 232, 240, 0.35)';
        ctx.fill();
      });

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

/* ============================================================================
   EMBEDDED VISUAL ASSETS & FULL WEBSITE CONTENT (FROM PAKGERMANACADEMY.COM)
   ============================================================================ */
const HERO_IMAGE = "data:image/jpeg;base64,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";
const HYBRID_IMAGE = "data:image/jpeg;base64,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";
const ONLINE_IMAGE = "data:image/jpeg;base64,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";
const POPUP_IMAGE = "data:image/jpeg;base64,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";

// Exact Batches from the Opening Popup Screenshot (image_f2c7a0.png)
const POPUP_BATCHES = [
  {
    id: 'b-a1-campus-aft',
    label: 'A1 On Campus (Afternoon) - 19 Oct 26',
    name: 'A1 On Campus (Afternoon)',
    date: '19 Oct 26',
    course: 'A1 – Anfänger',
    mode: 'Hybrid Pro Classes (Gujranwala + Online)',
    timing: '3:00 PM – 5:00 PM (Gujranwala Campus)',
  },
  {
    id: 'b-a1-online-aft',
    label: 'Online A1 (Afternoon): 19 Oct 26',
    name: 'Online A1 (Afternoon)',
    date: '19 Oct 26',
    course: 'A1 – Anfänger',
    mode: 'Online Classes (100% Live Remote)',
    timing: '1:00 PM – 3:00 PM PKT (Live Online)',
  },
  {
    id: 'b-a1-online-morn',
    label: 'Online A1 (Morning): 19 Oct 26',
    name: 'Online A1 (Morning)',
    date: '19 Oct 26',
    course: 'A1 – Anfänger',
    mode: 'Online Classes (100% Live Remote)',
    timing: '10:00 AM – 12:00 PM PKT (Live Online)',
  },
  {
    id: 'b-a2-online-eve',
    label: 'Online A2 (Evening): 19 Oct 26',
    name: 'Online A2 (Evening)',
    date: '19 Oct 26',
    course: 'A2 – Grundkenntnisse',
    mode: 'Online Classes (100% Live Remote)',
    timing: '9:00 PM – 11:00 PM PKT (Live Online)',
  },
  {
    id: 'b-b1-online-eve',
    label: 'Online B1 (Evening) : 19 Oct 26',
    name: 'Online B1 (Evening)',
    date: '19 Oct 26',
    course: 'B1 – Mittelstufe 1',
    mode: 'Online Classes (100% Live Remote)',
    timing: '9:00 PM – 11:00 PM PKT (Live Online)',
  },
];

// Complete Course Data (Home Grid + Full Dedicated Subpages from pakgermanacademy.com)
const COURSES = [
  {
    id: 'A1',
    pageId: 'a1',
    code: 'A1',
    title: 'A1 – Anfänger',
    fullTitle: 'A1 – Beginner / Anfänger',
    subpageHeading: 'A1 Level – Beginner Course',
    description: 'Learn basic words, greetings, and everyday phrases.',
    homeDescription:
      'Start your German journey! Learn basic words, greetings, numbers, and everyday phrases to introduce yourself and handle simple conversations.',
    duration: '8 Weeks • 60 Hours',
    badge: 'Foundation Tier',
    accent: 'from-amber-500/20 via-red-500/10 to-transparent',
    borderGlow: 'hover:border-amber-400/60',
    sampleGerman: 'Guten Tag! Ich lerne Deutsch an der Pak German Academy.',
    sampleEnglish: 'Good day! I am learning German at Pak German Academy.',
    overview: [
      'The A1 German Level is the perfect starting point for beginners who have little or no prior knowledge of the German language. This level helps you build a strong foundation in speaking, listening, reading, and writing — focusing on practical communication for everyday situations.',
      "By the end of the course, you'll be able to introduce yourself, talk about your family, order food, ask for directions, and handle simple conversations confidently.",
    ],
    whatYouWillLearn: [
      'Basic German vocabulary and sentence structure',
      'Greetings, introductions, and polite expressions',
      'Numbers, days, months, and time expressions',
      'Talking about yourself, family, hobbies, and daily routine',
      'Asking and answering simple questions',
      'Shopping, food, travel, and public transportation terms',
      'Basic grammar (nouns, verbs, gender, articles, simple tenses)',
      'Pronunciation and listening comprehension practice',
      'Writing short texts like messages and forms',
    ],
    preparationAndPractice: [
      'Interactive speaking sessions for daily conversations',
      'Vocabulary drills and grammar games',
      'Listening exercises using real-life German dialogues',
      'Regular writing assignments and teacher feedback',
      'Pair work and group discussions',
      'Weekly quizzes and mock tests for Goethe/TELC A1 exam',
      'Final assessment & certificate of completion',
    ],
    outcomes: [
      'Understand and use everyday expressions and simple phrases',
      'Communicate in a basic way when the other person speaks slowly and clearly',
      'Feel confident to move on to A2 (Elementary Level)',
      'Apply for visa or study programs that require A1 German certification',
    ],
  },
  {
    id: 'A2',
    pageId: 'a2',
    code: 'A2',
    title: 'A2 – Grundkenntnisse',
    fullTitle: 'A2 – Elementary / Grundkenntnisse',
    subpageHeading: 'A2 Level – Elementary Course',
    description: 'Communicate confidently in familiar situations (shopping, travel).',
    homeDescription:
      'Build on your basics. Understand and use common expressions for daily life, shopping, travel, and work — communicate more confidently in familiar situations.',
    duration: '8 Weeks • 70 Hours',
    badge: 'Everyday Fluency',
    accent: 'from-red-500/20 via-amber-500/10 to-transparent',
    borderGlow: 'hover:border-red-400/60',
    sampleGerman: 'Können Sie mir bitte sagen, wann der nächste Zug nach Berlin fährt?',
    sampleEnglish: 'Could you please tell me when the next train to Berlin departs?',
    overview: [
      'The A2 German Level is designed for learners who have completed A1 or already understand basic German. At this level, you will expand your vocabulary, improve sentence structure, and gain the confidence to handle more complex conversations in everyday life.',
      "By the end of A2, you'll be able to discuss familiar topics like work, travel, and personal interests, understand simple texts, and interact naturally in most daily situations.",
    ],
    whatYouWillLearn: [
      'Extended vocabulary for daily communication',
      'Talking about personal experiences, plans, and opinions',
      'Describing your surroundings, hobbies, and travel experiences',
      'Reading and understanding short texts, letters, and ads',
      'Writing simple emails, notes, and personal messages',
      'Shopping, food, travel, and public transportation terms',
      'Grammar focus: accusative & dative cases, modal verbs, past tense (Perfekt)',
      'Pronunciation and listening comprehension practice',
      'Writing short texts like messages and forms',
      'Practice with real-life dialogues and role plays',
    ],
    preparationAndPractice: [
      'Speaking sessions focused on real-world topics',
      'Listening comprehension through audio and video exercises',
      'Grammar revision with interactive worksheets',
      'Pair discussions and storytelling activities',
      'Writing practice: emails, short essays, and dialogues',
      'Regular quizzes and mock exams for TELC/Goethe A2',
      'Final assessment & certificate of completion',
    ],
    outcomes: [
      'Understand sentences and frequently used expressions related to daily life',
      'Communicate in routine situations requiring direct information exchange',
      'Talk about your background, environment, and basic needs',
      'Be fully prepared to progress to B1 (Intermediate Level)',
      'Apply for Ausbildung, study, or visa programs requiring A2 German certification',
    ],
  },
  {
    id: 'B1',
    pageId: 'b1',
    code: 'B1',
    title: 'B1 – Mittelstufe 1',
    fullTitle: 'B1 – Intermediate / Mittelstufe 1',
    subpageHeading: 'B1 Level – Intermediate Course',
    description: 'Gain independence. Talk about experiences and plans.',
    homeDescription:
      'Gain independence in German. Talk about experiences, plans, opinions, and ideas. At this level, you can live, study, or work in Germany with confidence.',
    duration: '10 Weeks • 90 Hours',
    badge: 'Ausbildung & Visa Core',
    accent: 'from-amber-400/25 via-red-600/15 to-transparent',
    borderGlow: 'hover:border-amber-400/70',
    sampleGerman: 'Ich plane meine berufliche Ausbildung in Deutschland erfolgreich zu beginnen.',
    sampleEnglish: 'I plan to successfully start my vocational training in Germany.',
    overview: [
      'The B1 German Level helps you move from basic communication to full independence in the language. At this stage, you start understanding main ideas of complex texts, expressing your thoughts clearly, and participating in conversations about familiar topics such as education, work, travel, and culture.',
      'This course prepares you to live, study, or work in Germany with confidence and ease.',
    ],
    whatYouWillLearn: [
      'Expressing opinions, feelings, and preferences confidently',
      'Talking about experiences, goals, and future plans',
      'Understanding main ideas from radio, news, or short articles',
      'Writing structured texts like emails, stories, and essays',
      'Grammar focus: subordinate clauses, adjective endings, past tense (Präteritum & Perfekt)',
      'Describing events, explaining reasons, and giving arguments',
      'Expanding vocabulary for work, studies, and daily communication',
      'Understanding cultural aspects and idiomatic expressions',
      'Preparing for B1 TELC / Goethe Zertifikat exams',
    ],
    preparationAndPractice: [
      'Advanced speaking practice through debates and role plays',
      'Listening comprehension using authentic German audios',
      'Writing tasks with teacher feedback and corrections',
      'Pair & group discussions on real-life topics',
      'Reading practice: short stories, blogs, and newspaper articles',
      'Grammar workshops for complex sentence structures',
      'Weekly assessments and mock exams for B1 certification',
    ],
    outcomes: [
      'Understand the main points of clear standard speech on familiar topics',
      'Manage most situations while traveling or living in German-speaking countries',
      'Write connected texts and express opinions in detail',
      'Communicate fluently in daily and professional contexts',
      'Meet the German language requirement for Ausbildung, Visa, or University Admission',
    ],
  },
  {
    id: 'B2',
    pageId: 'b2',
    code: 'B2',
    title: 'B2 – Mittelstufe 2',
    fullTitle: 'B2 – Upper Intermediate / Mittelstufe 2',
    subpageHeading: 'B2 Level – Upper Intermediate Course',
    description: 'Reach professional fluency for university or work.',
    homeDescription:
      'Reach professional fluency. Understand complex texts, express yourself clearly, and discuss topics in detail — ideal for university admission or professional success in Germany.',
    duration: '12 Weeks • 110 Hours',
    badge: 'Executive & University',
    accent: 'from-red-600/25 via-amber-400/20 to-transparent',
    borderGlow: 'hover:border-red-500/70',
    sampleGerman: 'Dank fundierter Sprachkenntnisse arbeite ich effektiv in internationalen Teams.',
    sampleEnglish: 'Thanks to solid language proficiency, I work effectively in international teams.',
    overview: [
      'The B2 German Level takes your communication skills to an advanced level — where you can express yourself fluently, understand complex ideas, and interact naturally with native speakers.',
      "This level is ideal for students preparing for higher education, professional careers, or permanent settlement in Germany. You'll master the language needed for university, workplace, and social interactions with confidence and precision.",
    ],
    whatYouWillLearn: [
      'Understanding complex written and spoken German',
      'Expressing detailed opinions, arguments, and viewpoints',
      'Reading and analyzing articles, reports, and academic texts',
      'Writing professional emails, essays, and formal letters',
      'Grammar focus: passive voice, subjunctive mood, relative clauses, advanced tenses',
      'Expanding vocabulary for work, studies, and social life',
      'Understanding idioms, expressions, and formal German',
      'Building pronunciation accuracy and natural flow',
      'Preparation for TELC / Goethe B2 certification exam',
    ],
    preparationAndPractice: [
      'Advanced speaking practice: debates, presentations & interviews',
      'Listening comprehension from authentic sources (news, podcasts, lectures)',
      'Writing workshops: reports, summaries, and opinion essays',
      'Group discussions on global and cultural topics',
      'Reading practice using real German media (articles, magazines, blogs)',
      'Intensive grammar review & error correction sessions',
      'Regular assessments & mock exams for B2 Zertifikat',
    ],
    outcomes: [
      'Understand main ideas of complex texts and discussions',
      'Communicate naturally with fluency and spontaneity',
      'Express opinions clearly and support arguments effectively',
      'Write professional and academic-level German texts',
      'Meet the language requirement for University Admission, Work Visa, or Ausbildung programs in Germany',
    ],
  },
];

const LEARNING_MODES = [
  {
    id: 'hybrid',
    title: 'Hybrid Pro Classes',
    subtitle: 'On-Campus Gujranwala + Digital Studio',
    description: 'Mix of on-campus (Gujranwala) and online flexibility.',
    longDescription:
      'Study your way with a mix of on-campus interaction and online flexibility. Benefit from direct instructor support and live sessions, ensuring a seamless learning experience whether you are in the classroom or at home.',
    image: HYBRID_IMAGE,
    tag: 'GUJRANWALA FLAGSHIP CAMPUS',
    features: [
      'In-person immersion at Civic Center Basement Shop No. 108, Gujranwala',
      'Seamless switch to live HD stream on days you travel or work late',
      'Interactive speaking labs, mock Goethe oral exams & peer debates',
      'Dedicated mentor feedback & physical study material kit included',
    ],
    schedules: [
      { label: 'A1 On Campus (Afternoon)', time: 'Starts 19 Oct 26 • 3:00 PM – 5:00 PM' },
      { label: 'A2 On Campus (Morning)', time: 'Starts 26 Oct 26 • 11:00 AM – 1:00 PM' },
      { label: 'Evening Executive Track', time: 'Mon–Fri • 6:30 PM – 8:30 PM' },
    ],
  },
  {
    id: 'online',
    title: 'Online Classes',
    subtitle: 'Global Live Classroom • 100% Remote',
    description: 'Flexible schedules and live sessions from anywhere.',
    longDescription:
      'Learn from anywhere with flexible schedules, live sessions, and complete guidance, making it easy to balance your studies with daily life.',
    image: ONLINE_IMAGE,
    tag: 'LIVE INTERACTIVE CLOUD',
    features: [
      'Live daily interactive sessions with certified German instructors',
      '24/7 access to HD recorded lectures, grammar decks & audio drills',
      'Breakout speaking rooms for real-time German conversation practice',
      'Tailored for working professionals and students across Pakistan & abroad',
    ],
    schedules: [
      { label: 'Online A1 (Morning)', time: 'Starts 19 Oct 26 • 10:00 AM – 12:00 PM' },
      { label: 'Online A1 (Afternoon)', time: 'Starts 19 Oct 26 • 1:00 PM – 3:00 PM' },
      { label: 'Online A2 / B1 (Evening)', time: 'Starts 19 Oct 26 • 9:00 PM – 11:00 PM' },
    ],
  },
];

const VISA_SERVICES = [
  {
    id: 'study',
    title: 'Study Visa',
    description: 'Tuition-free higher education at top German universities.',
    longDescription:
      'Unlock tuition-free higher education at top German universities. We streamline your entire student journey by managing university applications, assisting with your blocked account (Sperrkonto) setup, and conducting rigorous mock interviews to maximize your visa success rate.',
    icon: GraduationCap,
    requiredLevel: 'B1 / B2 German or IELTS + A2',
    timeline: 'University & Embassy Ready',
    accent: 'from-amber-500/20 to-red-600/10',
    highlights: [
      'University shortlisting across TU9 & public German universities',
      'APS Certificate & Uni-Assist application documentation management',
      'Blocked Account (Sperrkonto) setup & SOP / Letter of Motivation crafting',
      '1-on-1 German Embassy Islamabad / Karachi visa interview simulation',
    ],
  },
  {
    id: 'ausbildung',
    title: 'Ausbildung Visa',
    description: 'Earn a monthly stipend while learning a skilled trade.',
    longDescription:
      'The Ausbildung program allows you to earn a monthly stipend while learning a skilled trade in Germany. Our consultancy handles the heavy lifting: securing verified training contracts from German employers, gaining federal agency approvals, and preparing a flawless visa file for the embassy.',
    icon: Briefcase,
    requiredLevel: 'CEFR B1 / B2 Certified',
    timeline: 'Earn €1,000 – €1,400 / Month',
    accent: 'from-red-600/20 to-amber-500/10',
    highlights: [
      'Direct placement pathways in Nursing, IT, Mechatronics & Hospitality',
      'German standard CV (Lebenslauf) & Anschreiben tailored for employers',
      'Employer video interview coaching in German with native-level trainers',
      'Complete ZAV pre-approval & vocational contract verification support',
    ],
  },
  {
    id: 'family',
    title: 'Family Reunion',
    description: 'Bring your family together without legal stress.',
    longDescription:
      'Bring your family together without the legal stress. The German Family Reunion Visa involves strict document verification. We organize your legal files, certificates, and housing proofs to ensure your application satisfies the immigration authorities (Ausländerbehörde) without costly delays.',
    icon: Users,
    requiredLevel: 'CEFR A1 (Start Deutsch 1)',
    timeline: 'Ausländerbehörde Compliant',
    accent: 'from-amber-400/20 to-slate-800/40',
    highlights: [
      'Guaranteed A1 Start Deutsch 1 exam preparation for spouses',
      'Marriage certificate attestation, translation & legal verification',
      'Complete German Embassy family reunification file compilation',
      'Housing proof & Ausländerbehörde documentation compliance check',
    ],
  },
];

// Verbatim Bilingual Student Testimonials from pakgermanacademy.com
const TESTIMONIALS = [
  {
    id: 'ahmed',
    name: 'Ahmed Raza',
    role: 'B1 Student',
    english:
      'The interactive classes and speaking sessions really improved my confidence. I can now communicate comfortably at work and in everyday life.',
    german:
      'Die interaktiven Kurse und Sprechübungen haben mein Selbstvertrauen enorm verbessert. Jetzt kann ich mich im Alltag und bei der Arbeit sicher ausdrücken.',
    badge: 'Goethe B1 Passed',
  },
  {
    id: 'fatimah',
    name: 'Fatimah Haider',
    role: 'Ausbildung Visa Student',
    english:
      'The academy not only helped me learn German but also guided me through my Ausbildung visa process. Highly recommend it to anyone planning a future in Germany!',
    german:
      'Die Akademie hat mir nicht nur beim Deutschlernen geholfen, sondern mich auch durch den Ausbildung-Visaprozess begleitet. Sehr empfehlenswert für alle, die in Deutschland eine Zukunft planen!',
    badge: 'Ausbildung Contract Secured',
  },
  {
    id: 'saad',
    name: 'Saad Ali',
    role: 'B2 Student',
    english:
      'The learning environment is motivating, and the lessons are fun and practical. I finally feel ready for my B2 exam and my studies in Germany!',
    german:
      'Die Lernumgebung ist motivierend, und der Unterricht ist unterhaltsam und praxisnah. Ich fühle mich endlich bereit für meine B2-Prüfung und mein Studium in Deutschland!',
    badge: 'University Pathway',
  },
  {
    id: 'muhammad',
    name: 'Muhammad Ali',
    role: 'A1 Student',
    english:
      'I started with zero knowledge of German, and within a few weeks, I could introduce myself and have basic conversations. The teachers are patient and very supportive!',
    german:
      'Ich hatte keine Kenntnisse in Deutsch, und nach ein paar Wochen konnte ich mich vorstellen und einfache Gespräche führen. Die Lehrer sind sehr geduldig und hilfsbereit!',
    badge: 'A1 Start Deutsch 1',
  },
];

const QUIZ_QUESTIONS = [
  {
    q: 'How would you greet someone formally in Berlin at 2:00 PM?',
    options: ['Gute Nacht', 'Guten Tag', 'Auf Wiedersehen', 'Bis bald'],
    correct: 1,
  },
  {
    q: 'Choose the correct verb form: "Ich ___ gestern nach München gefahren."',
    options: ['habe', 'bin', 'werde', 'kann'],
    correct: 1,
  },
  {
    q: 'Complete the subordinate clause: "Ich lerne Deutsch, ___ ich in Deutschland studieren möchte."',
    options: ['denn', 'aber', 'weil', 'oder'],
    correct: 2,
  },
  {
    q: 'Which expression best fits a formal professional interview?',
    options: [
      'Ich verfüge über fundierte Erfahrungen in diesem Bereich.',
      'Ich mache das halt so jeden Tag.',
      'Keine Ahnung, was das bedeutet.',
      'Mal schauen, ob es klappt.',
    ],
    correct: 0,
  },
];

/* ============================================================================
   SAFE CLIPBOARD HELPER
   ============================================================================ */
function copyTextSafely(text, onSuccess) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => onSuccess(text))
        .catch(() => fallbackCopy(text, onSuccess));
      return;
    }
  } catch (err) {
    // Fallback below
  }
  fallbackCopy(text, onSuccess);
}

function fallbackCopy(text, onSuccess) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onSuccess(text);
  } catch (err) {
    onSuccess(text);
  }
}

/* ============================================================================
   MAIN APPLICATION COMPONENT
   ============================================================================ */
export default function App() {
  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });

  // Multi-Page Navigation State ('home' | 'about' | 'results' | 'courses' | 'a1' | 'a2' | 'b1' | 'b2' | 'contact' | 'terms')
  const [currentPage, setCurrentPage] = useState('home');
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Opening "Admissions are now Open!" Popup Modal (Automatically visible on initial load, just like pakgermanacademy.com!)
  const [admissionsPopupOpen, setAdmissionsPopupOpen] = useState(true);
  const [selectedPopupBatch, setSelectedPopupBatch] = useState(POPUP_BATCHES[0]);

  // Section refs for Home scroll-linked parallax
  const heroRef = useRef(null);
  const coursesRef = useRef(null);
  const modesRef = useRef(null);
  const visasRef = useRef(null);
  const footerRef = useRef(null);

  const heroScroll = useScroll({ target: heroRef });
  const coursesScroll = useScroll({ target: coursesRef });
  const modesScroll = useScroll({ target: modesRef });
  const visasScroll = useScroll({ target: visasRef });

  const heroTitleY = useTransform(heroScroll.targetProgress, [0, 1], [0, -60]);
  const heroVisualY = useTransform(heroScroll.targetProgress, [0, 1], [0, 45]);
  const coursesParallaxY = useTransform(coursesScroll.targetProgress, [0, 1], [25, -25]);
  const modesLeftY = useTransform(modesScroll.targetProgress, [0, 1], [30, -25]);
  const modesRightY = useTransform(modesScroll.targetProgress, [0, 1], [-20, 30]);
  const visasOrbScale = useTransform(visasScroll.targetProgress, [0, 0.5, 1], [0.95, 1.03, 0.97]);

  // Interactive States
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [activeModeTab, setActiveModeTab] = useState('both');
  const [selectedSchedule, setSelectedSchedule] = useState({ hybrid: 0, online: 0 });
  const [activeVisa, setActiveVisa] = useState(VISA_SERVICES[0]);
  const [checkedDocs, setCheckedDocs] = useState({
    'study-0': true,
    'ausbildung-0': true,
    'family-0': true,
  });
  const [speakingId, setSpeakingId] = useState(null);

  // Contact Page Interactive Calendar State (October 2026)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(19);

  // Enrollment Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    phone: '',
    email: '',
    course: 'A1 – Anfänger',
    mode: 'Hybrid Pro Classes (Gujranwala + Online)',
    batch: 'A1 On Campus (Afternoon) - 19 Oct 26',
    visaInterest: 'Study Visa',
  });
  const [enrollSubmitted, setEnrollSubmitted] = useState(false);

  // Quiz Modal State
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  // Vite Local Setup Modal State
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  // Contact Page Inquiry Form State
  const [contactSent, setContactSent] = useState(false);
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'A1 On-Campus / Online Batch (19 Oct 26)',
    message: '',
  });

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  const navigateToPage = useCallback((pageKey) => {
    setCurrentPage(pageKey);
    setCoursesDropdownOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const speakGerman = useCallback((id, phrase) => {
    setSpeakingId(id);
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = 'de-DE';
        utterance.rate = 0.95;
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(utterance);
        setTimeout(() => setSpeakingId(null), 4500);
        return;
      }
    } catch (e) {
      // Fallback visual pulse
    }
    setTimeout(() => setSpeakingId(null), 2600);
  }, []);

  const scrollToSection = (ref) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        if (ref && ref.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    } else if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openEnrollWithPreset = (courseTitle, modeTitle, visaTitle, batchLabel) => {
    setEnrollForm((prev) => ({
      ...prev,
      course: courseTitle || prev.course,
      mode: modeTitle || prev.mode,
      visaInterest: visaTitle || prev.visaInterest,
      batch: batchLabel || prev.batch,
    }));
    setEnrollSubmitted(false);
    setEnrollModalOpen(true);
  };

  const handleQuizAnswer = (optionIdx) => {
    const updated = [...quizAnswers, optionIdx];
    setQuizAnswers(updated);
    if (quizStep + 1 < QUIZ_QUESTIONS.length) {
      setQuizStep(quizStep + 1);
    } else {
      const score = updated.reduce(
        (acc, ans, idx) => acc + (ans === QUIZ_QUESTIONS[idx].correct ? 1 : 0),
        0
      );
      const recommended =
        score <= 1 ? COURSES[0] : score === 2 ? COURSES[1] : score === 3 ? COURSES[2] : COURSES[3];
      setQuizResult({ score, recommended });
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  // Helper to render any of the 4 dedicated course pages (A1, A2, B1, B2)
  const activeCoursePageObj = useMemo(() => {
    return COURSES.find((c) => c.pageId === currentPage) || null;
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden font-sans">
      <style>{`
        .german-gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #fde68a 45%, #f59e0b 72%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.68);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.48) 0%, rgba(15, 23, 42, 0.78) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>

      {/* WebGL-Inspired Interactive Background */}
      <WebGLAuroraCanvas scrollProgress={smoothProgress} />

      {/* Top Scroll-Linked German Flag Neon Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-slate-900/80">
        <div
          className="h-full bg-gradient-to-r from-neutral-950 via-red-600 to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] transition-all duration-75"
          style={{ width: `${Math.max(smoothProgress * 100, 2)}%` }}
        />
      </div>

      {/* ========================================================================
          TOP UTILITY BAR (Exact Details from pakgermanacademy.com)
         ======================================================================== */}
      <div className="relative z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 py-2 text-[11px] sm:text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Civic Center Basement Shop No. 108, Gujranwala
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              pakgermanacademy@gmail.com
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Re-open Admissions Popup Trigger */}
            <button
              type="button"
              onClick={() => setAdmissionsPopupOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-bold hover:bg-emerald-500/25 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admissions Open (19 Oct 26 Batches)</span>
            </button>

            <span className="hidden sm:inline text-slate-600">|</span>

            <button
              type="button"
              onClick={() =>
                copyTextSafely('+92 309 8556348', () =>
                  showToast('WhatsApp & Phone +92 309 8556348 copied!')
                )
              }
              className="hidden sm:inline-flex items-center gap-1 text-amber-300 hover:text-white font-semibold transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+92 309 8556348</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================
          MULTI-PAGE NAVIGATION HEADER (Matches pakgermanacademy.com Menu)
         ======================================================================== */}
      <header className="sticky top-1 z-40 px-4 sm:px-8 pt-2">
        <div
          className={`max-w-7xl mx-auto rounded-2xl border transition-all duration-300 px-4 sm:px-6 py-3 flex items-center justify-between ${
            scrollY > 20
              ? 'glass-panel border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.75)]'
              : 'bg-slate-950/65 backdrop-blur-md border-white/10'
          }`}
        >
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => navigateToPage('home')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-x-0 top-0 h-1/3 bg-neutral-950" />
              <div className="absolute inset-x-0 top-1/3 h-1/3 bg-red-600/90" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-amber-400/90" />
              <span className="relative z-10 font-black text-xs tracking-tighter text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                PGA
              </span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                PAK GERMAN ACADEMY
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Gujranwala • Online • Visa Advisory
              </span>
            </div>
          </button>

          {/* Desktop Multi-Page Menu: Home | About | Results | Our Courses (A1-B2) | Contact */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'results', label: 'Results' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateToPage(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  currentPage === item.id
                    ? 'bg-white/10 text-amber-300 border border-amber-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Our Courses Dropdown (With Overview + A1, A2, B1, B2 Subpages) */}
            <div
              className="relative"
              onMouseEnter={() => setCoursesDropdownOpen(true)}
              onMouseLeave={() => setCoursesDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => navigateToPage('courses')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-all ${
                  ['courses', 'a1', 'a2', 'b1', 'b2'].includes(currentPage)
                    ? 'bg-white/10 text-amber-300 border border-amber-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Our Courses</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {coursesDropdownOpen && (
                <div className="absolute left-0 top-full pt-2 w-72 z-50">
                  <div className="rounded-2xl glass-panel border border-white/15 p-2 shadow-2xl space-y-1">
                    <button
                      type="button"
                      onClick={() => navigateToPage('courses')}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                        currentPage === 'courses'
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <span>All Courses Overview (+ 1v1)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    {[
                      { id: 'a1', label: 'A1 – Beginner Level', badge: 'Anfänger' },
                      { id: 'a2', label: 'A2 – Elementary Level', badge: 'Grundkenntnisse' },
                      { id: 'b1', label: 'B1 – Intermediate Level', badge: 'Mittelstufe 1' },
                      { id: 'b2', label: 'B2 – Upper Intermediate Level', badge: 'Mittelstufe 2' },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => navigateToPage(sub.id)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between ${
                          currentPage === sub.id
                            ? 'bg-gradient-to-r from-red-600/30 to-amber-500/30 text-amber-300 font-bold border border-amber-400/30'
                            : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                        }`}
                      >
                        <span>{sub.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          {sub.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigateToPage('contact')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentPage === 'contact'
                  ? 'bg-white/10 text-amber-300 border border-amber-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetQuiz();
                setQuizOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Level Test</span>
            </button>

            <button
              type="button"
              onClick={() => openEnrollWithPreset()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all shadow-[0_0_25px_rgba(239,68,68,0.35)]"
            >
              <span>Enroll Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Multi-Page Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden max-w-7xl mx-auto mt-2 rounded-2xl glass-panel border border-white/15 p-4 space-y-2 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About Us' },
                { id: 'results', label: 'Our Results' },
                { id: 'courses', label: 'Our Courses' },
                { id: 'a1', label: 'A1 – Beginner' },
                { id: 'a2', label: 'A2 – Elementary' },
                { id: 'b1', label: 'B1 – Intermediate' },
                { id: 'b2', label: 'B2 – Upper Inter.' },
                { id: 'contact', label: 'Contact Us' },
                { id: 'terms', label: 'Terms & Conditions' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigateToPage(p.id)}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                    currentPage === p.id
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-slate-950'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Multi-Page Pill Switcher Strip (So every page & subpage is 1-click visible) */}
        <div className="max-w-7xl mx-auto mt-2 flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 shrink-0">
            Site Pages:
          </span>
          {[
            { id: 'home', label: 'Home' },
            { id: 'about', label: 'About' },
            { id: 'results', label: 'Results' },
            { id: 'courses', label: 'Our Courses' },
            { id: 'a1', label: 'A1 – Beginner' },
            { id: 'a2', label: 'A2 – Elementary' },
            { id: 'b1', label: 'B1 – Intermediate' },
            { id: 'b2', label: 'B2 – Upper Intermediate' },
            { id: 'contact', label: 'Contact' },
            { id: 'terms', label: 'Terms & Conditions' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateToPage(tab.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all border ${
                currentPage === tab.id
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ========================================================================
          PAGE VIEW 1: HOME PAGE (Includes all required sections + links to subpages)
         ======================================================================== */}
      {currentPage === 'home' && (
        <main>
          {/* 1. HERO SECTION */}
          <section
            ref={heroRef}
            id="hero"
            className="relative z-10 pt-10 pb-20 md:pt-16 md:pb-28 px-4 sm:px-8 max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              <motion.div
                style={{ y: heroTitleY }}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85 }}
                className="lg:col-span-7 space-y-6"
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-card border border-white/15">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/90">
                    Pak German Academy • Master the German Language with Confidence
                  </span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.03] text-white">
                  Master German.{' '}
                  <span className="block mt-1 german-gradient-text">
                    Secure Your Future.
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-200 max-w-2xl leading-relaxed font-medium">
                  Welcome to Pak German Academy — where learning German becomes simple, fun, and effective.
                </p>

                <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                  Whether you&apos;re a complete beginner or looking to improve your fluency, our expert teachers and interactive lessons in Gujranwala and online will help you achieve your language goals faster than ever.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openEnrollWithPreset()}
                    className="px-7 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-red-600 via-red-500 to-amber-400 text-slate-950 shadow-[0_12px_35px_-8px_rgba(239,68,68,0.65)] flex items-center gap-2.5 group"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToSection(visasRef)}
                    className="px-7 py-4 rounded-2xl font-bold text-base glass-card border border-white/20 text-white hover:border-amber-400/60 hover:bg-white/10 flex items-center gap-2.5 transition-all"
                  >
                    <Compass className="w-5 h-5 text-amber-400" />
                    <span>Explore Visas</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setAdmissionsPopupOpen(true)}
                    className="px-4 py-4 rounded-2xl text-xs sm:text-sm font-bold text-emerald-300 border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>19 Oct 26 Batch Schedule</span>
                  </button>
                </div>

                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 max-w-xl">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white">A1 – B2</div>
                    <div className="text-xs text-slate-400 mt-0.5">Goethe & TELC Prep</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">5.0 ★</div>
                    <div className="text-xs text-slate-400 mt-0.5">96+ Verified Reviews</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-red-400">1-on-1</div>
                    <div className="text-xs text-slate-400 mt-0.5">& Group Batches</div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Parallax Architectural Glass Showcase */}
              <motion.div
                style={{ y: heroVisualY }}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15 }}
                className="lg:col-span-5 relative"
              >
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-red-600/30 via-amber-500/25 to-transparent blur-2xl pointer-events-none" />

                <div className="relative rounded-3xl glass-card border border-white/15 overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.85)]">
                  <div className="h-1.5 w-full bg-gradient-to-r from-neutral-950 via-red-600 to-amber-400" />

                  <div className="relative h-60 sm:h-64 overflow-hidden">
                    <img
                      src={HERO_IMAGE}
                      alt="Berlin Reichstag dome and modern European architecture at night"
                      className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                    <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl glass-panel border border-white/15 flex items-center gap-2 text-xs font-semibold text-white">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>Deutschland Career & Study Bridge</span>
                    </div>
                  </div>

                  {/* Interactive German Audio Pronunciation Card Inside Hero */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                        Interactive Pronunciation Lab
                      </span>
                      <span className="text-xs text-slate-400">CEFR Live Preview</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm sm:text-base font-bold text-white">
                            &ldquo;{selectedCourse.sampleGerman}&rdquo;
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedCourse.sampleEnglish}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakGerman('hero-audio', selectedCourse.sampleGerman)}
                          aria-label="Listen to German pronunciation"
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                            speakingId === 'hero-audio'
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.7)]'
                              : 'bg-white/5 text-amber-400 border-white/15 hover:bg-white/10'
                          }`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        {COURSES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCourse(c)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              selectedCourse.id === c.id
                                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-slate-950'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {c.code}
                          </button>
                        ))}
                        <span className="ml-auto text-[11px] text-slate-400">
                          Click level to test audio
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* 2. COURSE GRID (A1, A2, B1, B2 + Deep Links to Dedicated Course Pages) */}
          <section
            ref={coursesRef}
            id="courses"
            className="relative z-10 py-16 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
          >
            <motion.div
              style={{ y: coursesParallaxY }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
            >
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-red-400 mb-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Discover Our German Language Courses</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  German Mastery <span className="german-gradient-text">Course Grid</span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigateToPage('courses')}
                  className="px-4 py-2.5 rounded-xl glass-card border border-white/15 text-xs sm:text-sm font-bold text-white hover:border-amber-400/50 transition-all flex items-center gap-2"
                >
                  <span>View Full Courses Page</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetQuiz();
                    setQuizOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl glass-card border border-amber-400/40 text-xs sm:text-sm font-bold text-amber-300 hover:bg-amber-400/15 transition-all flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Not sure of your level? Take 60s Quiz</span>
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {COURSES.map((course, idx) => {
                const isSpeaking = speakingId === course.id;
                return (
                  <motion.article
                    key={course.id}
                    id={course.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -10, scale: 1.015 }}
                    transition={{ duration: 0.65, delay: idx * 0.08 }}
                    viewport={{ once: false, amount: 0.15 }}
                    className={`group relative rounded-3xl glass-card border border-white/10 ${course.borderGlow} p-6 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${course.accent} opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                    />
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neutral-900 via-red-600 to-amber-400 opacity-40 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-white/10 text-amber-300 border border-white/10">
                          {course.badge}
                        </span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-red-400" />
                          {course.duration}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                          {course.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-200 leading-relaxed font-semibold">
                          {course.description}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                          {course.homeDescription}
                        </p>
                      </div>

                      <ul className="space-y-1.5 pt-2 border-t border-white/10">
                        {course.outcomes.slice(0, 3).map((outcome, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative z-10 pt-5 mt-5 border-t border-white/10 space-y-2.5">
                      <button
                        type="button"
                        onClick={() => speakGerman(course.id, course.sampleGerman)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-white/10 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-all"
                      >
                        <span className="truncate pr-2">
                          Hear {course.code}: &ldquo;{course.sampleGerman}&rdquo;
                        </span>
                        <Volume2
                          className={`w-4 h-4 shrink-0 ${
                            isSpeaking ? 'text-amber-400 animate-bounce' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => navigateToPage(course.pageId)}
                          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/15 border border-white/15 text-slate-200 transition-all flex items-center justify-center gap-1"
                        >
                          <span>Learn More</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEnrollWithPreset(course.title)}
                          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all flex items-center justify-center gap-1"
                        >
                          <span>Enroll {course.code}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* 1v1 Individualized Learning Callout (From pakgermanacademy.com Homepage) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              className="mt-8 rounded-3xl glass-card border border-amber-400/30 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 max-w-3xl">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-lg">
                  1v1
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    Personalized Executive Coaching
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Individualized Learning: 1-on-1 Private Sessions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                    Looking for a more personalized approach? We offer flexible one-to-one sessions tailored specifically to your learning pace and goals. Whether you are preparing for an exam or need to focus on specific conversation skills, our private tutoring provides the dedicated support you need to succeed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  openEnrollWithPreset(
                    '1v1 Private German Coaching',
                    '1-on-1 Private Personalized Session'
                  )
                }
                className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-gradient-to-r hover:from-red-600 hover:to-amber-500 text-white hover:text-slate-950 border border-white/15 transition-all shrink-0 flex items-center gap-2"
              >
                <span>Book 1-on-1 Session</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </motion.div>
          </section>

          {/* 3. LEARNING MODES (Split Section: Hybrid Pro Classes & Online Classes) */}
          <section
            ref={modesRef}
            id="modes"
            className="relative z-10 py-16 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
                  <Layers className="w-4 h-4" />
                  <span>Learn German with Expert Guidance</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  Flexible <span className="german-gradient-text">Learning Modes</span>
                </h2>
              </div>

              <div className="inline-flex p-1.5 rounded-2xl glass-card border border-white/15 self-start">
                {[
                  { id: 'both', label: 'Split View (Both)' },
                  { id: 'hybrid', label: 'Hybrid Pro (Gujranwala)' },
                  { id: 'online', label: '100% Online' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={tab.id}
                    type="button"
                    onClick={() => setActiveModeTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeModeTab === tab.id
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                activeModeTab === 'both' ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl mx-auto'
              } gap-8 items-stretch`}
            >
              {LEARNING_MODES.filter(
                (m) => activeModeTab === 'both' || activeModeTab === m.id
              ).map((mode, idx) => {
                const activeSchedIndex = selectedSchedule[mode.id] || 0;
                return (
                  <motion.div
                    key={mode.id}
                    style={{ y: idx === 0 ? modesLeftY : modesRightY }}
                    initial={{ opacity: 0, y: 36 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.7, delay: idx * 0.12 }}
                    viewport={{ once: false, amount: 0.15 }}
                    className="rounded-3xl glass-card border border-white/15 overflow-hidden flex flex-col justify-between shadow-[0_25px_70px_rgba(0,0,0,0.65)] group"
                  >
                    <div>
                      <div className="relative h-60 sm:h-64 overflow-hidden">
                        <img
                          src={mode.image}
                          alt={mode.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl glass-panel border border-white/15 text-[11px] font-extrabold tracking-widest uppercase text-amber-300 flex items-center gap-2">
                          {mode.id === 'hybrid' ? (
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-red-400" />
                          )}
                          <span>{mode.tag}</span>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 space-y-5">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-black text-white">
                            {mode.title}
                          </h3>
                          <p className="mt-2 text-base sm:text-lg text-amber-300 font-semibold">
                            {mode.description}
                          </p>
                          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {mode.longDescription}
                          </p>
                        </div>

                        <ul className="space-y-2">
                          {mode.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider text-slate-400">
                              Select Batch Slot
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              19 Oct 26 Intake Open
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {mode.schedules.map((slot, sIdx) => (
                              <button
                                key={slot.label}
                                type="button"
                                onClick={() =>
                                  setSelectedSchedule((prev) => ({ ...prev, [mode.id]: sIdx }))
                                }
                                className={`p-2.5 rounded-xl text-left border transition-all ${
                                  activeSchedIndex === sIdx
                                    ? 'bg-amber-400/15 border-amber-400 text-white'
                                    : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                <div className="text-xs font-bold">{slot.label}</div>
                                <div className="text-[11px] opacity-80 mt-0.5">{slot.time}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                      <button
                        type="button"
                        onClick={() =>
                          openEnrollWithPreset(
                            selectedCourse.title,
                            `${mode.title} — ${mode.schedules[activeSchedIndex].label}`,
                            undefined,
                            mode.schedules[activeSchedIndex].label
                          )
                        }
                        className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>Reserve {mode.title} Seat</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* 4. VISA CONSULTANCY SERVICES (Icon Grid + Verbatim Site Descriptions) */}
          <section
            ref={visasRef}
            id="visas"
            className="relative z-10 py-16 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto"
          >
            <motion.div
              style={{ scale: visasOrbScale }}
              className="text-center max-w-3xl mx-auto mb-14 space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-white/15 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Our Services • Explore Our Visa Program</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Visa Consultancy <span className="german-gradient-text">Services</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Navigating German immigration laws requires absolute precision. At Pak German Academy, we provide end-to-end visa consultancy services to make your transition to Europe seamless. From document verification and blocked accounts to embassy interview prep, our experts handle the bureaucracy so you can focus on your future.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {VISA_SERVICES.map((visa, idx) => {
                const IconComponent = visa.icon;
                const isSelected = activeVisa.id === visa.id;
                return (
                  <motion.div
                    key={visa.id}
                    id={visa.id}
                    initial={{ opacity: 0, y: 36 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, scale: 1.015 }}
                    transition={{ duration: 0.65, delay: idx * 0.1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    onClick={() => setActiveVisa(visa)}
                    className={`cursor-pointer rounded-3xl glass-card p-7 border transition-all flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'border-amber-400/80 shadow-[0_0_45px_rgba(245,158,11,0.22)]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${visa.accent} opacity-60 pointer-events-none`}
                    />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-white/15 flex items-center justify-center text-amber-400 shadow-inner">
                          <IconComponent className="w-7 h-7" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/10">
                          {visa.timeline}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-white">{visa.title}</h3>
                        <p className="mt-2 text-sm sm:text-base text-amber-300 font-semibold leading-relaxed">
                          {visa.description}
                        </p>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                          {visa.longDescription}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Language Requirement:</span>
                        <span className="font-bold text-amber-300">{visa.requiredLevel}</span>
                      </div>

                      <ul className="space-y-2 pt-1">
                        {visa.highlights.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <ChevronRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEnrollWithPreset(undefined, undefined, visa.title);
                        }}
                        className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                      >
                        <span>Book {visa.title} Consultation</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Interactive Visa Readiness Checklist Drawer */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              className="rounded-3xl glass-panel border border-white/15 p-6 sm:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                    <FileCheck className="w-4 h-4" />
                    <span>Interactive Dossier Tracker • {activeVisa.title}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Check Your {activeVisa.title} Milestones
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Click any requirement below to simulate your readiness progress with Pak German Academy&apos;s visa desk.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {activeVisa.highlights.map((milestone, idx) => {
                    const key = `${activeVisa.id}-${idx}`;
                    const checked = !!checkedDocs[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                          checked
                            ? 'bg-amber-400/15 border-amber-400/60 text-white'
                            : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            checked ? 'bg-amber-400 text-slate-950' : 'border border-white/25'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium leading-relaxed">{milestone}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </section>

          {/* 5. BILINGUAL STUDENT TESTIMONIALS SECTION (From pakgermanacademy.com) */}
          <section className="relative z-10 py-16 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
                  <Quote className="w-4 h-4" />
                  <span>Testimonials • Proven Student Outcomes</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  Life-Changing Results <span className="german-gradient-text">From Our Students</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateToPage('results')}
                className="px-4 py-2.5 rounded-xl glass-card border border-white/15 text-xs sm:text-sm font-bold text-amber-300 hover:border-amber-400/50 transition-all flex items-center gap-2 self-start"
              >
                <span>Open Full Results Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  viewport={{ once: false, amount: 0.15 }}
                  className="rounded-3xl glass-card border border-white/10 hover:border-amber-400/40 p-6 sm:p-7 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">{t.name}</h3>
                        <span className="text-xs font-semibold text-amber-400">{t.role}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/10">
                        {t.badge}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed">
                      &ldquo;{t.english}&rdquo;
                    </p>

                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-start justify-between gap-3">
                      <p className="text-xs text-amber-200/90 italic leading-relaxed">
                        „{t.german}“
                      </p>
                      <button
                        type="button"
                        onClick={() => speakGerman(`testi-${t.id}`, t.german)}
                        title="Listen to German testimonial"
                        className="p-2 rounded-lg bg-white/5 hover:bg-amber-400/20 text-amber-400 shrink-0 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* ========================================================================
          PAGE VIEW 2: ABOUT US PAGE (Matching pakgermanacademy.com About Content)
         ======================================================================== */}
      {currentPage === 'about' && (
        <main className="relative z-10 py-12 md:py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/15 text-xs font-bold uppercase tracking-widest text-amber-300">
              <span>About Pak German Academy</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Where Language Expertise Meets <span className="german-gradient-text">Learning Excellence</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Welcome to our Academy — your destination for expert teaching and immersive learning. Experience a natural, confident way to master German, guided by passionate and professional instructors.
            </p>
          </div>

          {/* Vision & Mission Split Cards (Verbatim from pakgermanacademy.com/our-courses/) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl glass-card border border-amber-400/30 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Eye className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Redefining Learning with Precision & Passion
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Our Vision</h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                To be the leading destination for German language education and cultural excellence — empowering students to achieve their dreams in Germany through personalized, ethical, and innovative learning experiences.
              </p>
            </div>

            <div className="rounded-3xl glass-card border border-red-500/30 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-red-400">
                Smart Learning. Confident Speaking.
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Our Mission</h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                Our mission is to make learning German simple, engaging, and effective for everyone. We aim to help students communicate with confidence, embrace new cultures, and unlock academic and professional opportunities in Germany.
              </p>
            </div>
          </div>

          {/* Smart Learning & Cultural Immersion Section */}
          <div className="rounded-3xl glass-panel border border-white/15 p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Smart Learning. Confident Speaking. Start Today!
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Professional German Training & Cultural Immersion
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Our academy specializes in professional German language training and cultural immersion programs that help you communicate confidently and naturally. Using innovative teaching methods and proven learning techniques, we deliver results that empower you to achieve your academic, career, and life goals in Germany.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigateToPage('courses')}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950"
                >
                  Explore A1–B2 Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => navigateToPage('contact')}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white/10 text-white hover:bg-white/15"
                >
                  Visit Gujranwala Campus
                </button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <img
                src={HYBRID_IMAGE}
                alt="Pak German Academy Studio"
                className="w-full h-64 object-cover rounded-2xl border border-white/15"
              />
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================
          PAGE VIEW 3: RESULTS PAGE (Matching pakgermanacademy.com/results/)
         ======================================================================== */}
      {currentPage === 'results' && (
        <main className="relative z-10 py-12 md:py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-14">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/15 text-xs font-bold uppercase tracking-widest text-amber-300">
              <Award className="w-4 h-4 text-red-400" />
              <span>Our Results • Student Success Stories</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Excellence in German Education, <span className="german-gradient-text">Backed by Proven Results</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              At Pak German Academy, student success is at the heart of everything we do. Through expert instruction, structured learning programs, and continuous support, our students consistently achieve outstanding results in German language examinations. Each success story reflects our commitment to quality education and our mission to help students confidently pursue their academic, professional, and immigration goals in Germany. We take pride in guiding learners from their first German lesson to their final certification and beyond.
            </p>
          </div>

          {/* Upcoming Goethe Exams Schedule (From Official Pak German Academy Announcements) */}
          <div className="rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Goethe-Institut & TELC Exam Readiness
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Goethe Exam Preparation Windows (Lahore Center)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openEnrollWithPreset('A1 – Anfänger', 'Exam Preparation Intensive')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 self-start"
              >
                Join Exam Prep Batch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  window: 'September 2026 Window',
                  dates: '25, 26 & 27 September',
                  levels: 'Levels: A1, A2 & B1',
                  location: 'Exam Location: Lahore',
                },
                {
                  window: 'October 2026 Window',
                  dates: '23, 24 & 25 October',
                  levels: 'Levels: A1, B1 & B2',
                  location: 'Exam Location: Lahore',
                },
                {
                  window: 'November 2026 Window',
                  dates: '20, 21 & 22 November',
                  levels: 'Levels: A1, A2 & B1',
                  location: 'Exam Location: Lahore',
                },
              ].map((exam) => (
                <div
                  key={exam.window}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2"
                >
                  <div className="text-xs font-bold text-amber-400">{exam.window}</div>
                  <div className="text-lg font-black text-white">{exam.dates}</div>
                  <div className="text-xs font-semibold text-slate-300">{exam.levels}</div>
                  <div className="text-[11px] text-slate-400">{exam.location}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bilingual Student Testimonials Grid */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Life-Changing Results From Our Students
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.id}
                  className="rounded-3xl glass-card border border-white/15 p-7 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{t.name}</h3>
                      <span className="text-xs font-bold text-amber-400">{t.role}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    &ldquo;{t.english}&rdquo;
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-start justify-between gap-3">
                    <p className="text-xs sm:text-sm text-amber-200/90 italic leading-relaxed">
                      „{t.german}“
                    </p>
                    <button
                      type="button"
                      onClick={() => speakGerman(`res-${t.id}`, t.german)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-amber-400/20 text-amber-400 shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================
          PAGE VIEW 4: OUR COURSES OVERVIEW PAGE (pakgermanacademy.com/our-courses/)
         ======================================================================== */}
      {currentPage === 'courses' && (
        <main className="relative z-10 py-12 md:py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-14">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/15 text-xs font-bold uppercase tracking-widest text-amber-300">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>Our Courses • CEFR A1 to B2 + 1v1</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Redefining Learning with <span className="german-gradient-text">Precision & Passion</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Our courses are designed with a strong focus on practical communication and gradual skill development. This approach emphasizes not only grammar and vocabulary, but also real-life speaking, listening, and cultural understanding — helping students learn German with confidence and purpose.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COURSES.map((course) => (
              <div
                key={course.id}
                className="rounded-3xl glass-card border border-white/15 p-7 flex flex-col justify-between space-y-6 hover:border-amber-400/50 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-black bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {course.fullTitle}
                    </span>
                    <span className="text-xs text-slate-400">{course.duration}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {course.subpageHeading}
                  </h2>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {course.overview[0]}
                  </p>
                  <div className="space-y-1.5 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Key Highlights:
                    </div>
                    {course.whatYouWillLearn.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => navigateToPage(course.pageId)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2"
                  >
                    <span>Open Full {course.code} Syllabus Page</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEnrollWithPreset(course.title)}
                    className="py-3 px-5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950"
                  >
                    Enroll {course.code}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================================
          PAGE VIEWS 5, 6, 7, 8: DEDICATED COURSE SUBPAGES (A1, A2, B1, B2)
          Contains 100% of the authentic syllabus from pakgermanacademy.com
         ======================================================================== */}
      {activeCoursePageObj && (
        <main className="relative z-10 py-12 md:py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
          {/* Breadcrumb & Level Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigateToPage('courses')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Courses</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {COURSES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigateToPage(c.pageId)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    c.id === activeCoursePageObj.id
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {c.fullTitle}
                </button>
              ))}
            </div>
          </div>

          {/* Course Hero Header */}
          <div className="rounded-3xl glass-card border border-white/15 p-8 sm:p-10 space-y-6 relative overflow-hidden">
            <div className="h-1.5 absolute top-0 inset-x-0 bg-gradient-to-r from-neutral-950 via-red-600 to-amber-400" />
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {activeCoursePageObj.fullTitle}
              </span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-400" />
                {activeCoursePageObj.duration}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white">
              {activeCoursePageObj.subpageHeading}
            </h1>

            <div className="space-y-3 max-w-4xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">
                Course Overview:
              </h2>
              {activeCoursePageObj.overview.map((para, i) => (
                <p key={i} className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openEnrollWithPreset(activeCoursePageObj.title)}
                className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 flex items-center gap-2 shadow-lg"
              >
                <span>Enroll in {activeCoursePageObj.title}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  speakGerman(
                    `sub-${activeCoursePageObj.id}`,
                    activeCoursePageObj.sampleGerman
                  )
                }
                className="px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm glass-panel border border-white/15 text-amber-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear Sample {activeCoursePageObj.code} Phrase</span>
              </button>
            </div>
          </div>

          {/* 3-Column Detailed Breakdown: What You'll Learn | Preparation & Practice | Outcome */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: What You'll Learn */}
            <div className="rounded-3xl glass-card border border-white/15 p-7 space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                01 • Curriculum Modules
              </div>
              <h3 className="text-2xl font-black text-white">What You&apos;ll Learn:</h3>
              <ul className="space-y-2.5 pt-2">
                {activeCoursePageObj.whatYouWillLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Preparation & Practice */}
            <div className="rounded-3xl glass-card border border-white/15 p-7 space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-widest text-red-400">
                02 • Methodology & Drills
              </div>
              <h3 className="text-2xl font-black text-white">Preparation & Practice:</h3>
              <ul className="space-y-2.5 pt-2">
                {activeCoursePageObj.preparationAndPractice.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Outcome */}
            <div className="rounded-3xl glass-card border border-white/15 p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                  03 • Certification & Visa Readiness
                </div>
                <h3 className="text-2xl font-black text-white">Outcome:</h3>
                <ul className="space-y-2.5 pt-2">
                  {activeCoursePageObj.outcomes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                <div className="text-xs font-bold text-amber-300">
                  Small Steps, Big Transformations — Empowering Every Individual Through Learning
                </div>
                <div className="text-xs text-slate-400">
                  Direct Hotline: +92 309 8556348
                </div>
                <button
                  type="button"
                  onClick={() => openEnrollWithPreset(activeCoursePageObj.title)}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 to-amber-500 text-slate-950"
                >
                  Register for {activeCoursePageObj.code} Now
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================
          PAGE VIEW 9: CONTACT PAGE (Matching pakgermanacademy.com/contact/)
         ======================================================================== */}
      {currentPage === 'contact' && (
        <main className="relative z-10 py-12 md:py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-14">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/15 text-xs font-bold uppercase tracking-widest text-amber-300">
              <span>Get In Touch • Contact Us</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Contact Us. <span className="german-gradient-text">We&apos;re Here to Help You</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Have questions or need assistance? Reach out to us for expert guidance, personalized solutions, and exceptional support. Learn more about our academy and teachers, and discover why so many students trust us to help them master the German language.
            </p>
          </div>

          {/* 4 Official Contact Info Cards from pakgermanacademy.com/contact/ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl glass-card border border-white/15 space-y-2">
              <Phone className="w-6 h-6 text-amber-400" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Our Phone
              </div>
              <div className="text-lg font-black text-white">+92 309 8556348</div>
              <p className="text-xs text-slate-400">Direct Call & WhatsApp Desk</p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-white/15 space-y-2">
              <Mail className="w-6 h-6 text-red-400" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Our Email
              </div>
              <div className="text-sm sm:text-base font-black text-white break-all">
                pakgermanacademy@gmail.com
              </div>
              <p className="text-xs text-slate-400">24/7 Admissions & Visa Support</p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-white/15 space-y-2">
              <MapPin className="w-6 h-6 text-amber-400" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Address
              </div>
              <div className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                Office No. 108, Civic Center, Basement Main GT Rd, Zahid Colony Shaheenabad, Gujranwala, 52250.
              </div>
              <p className="text-[11px] text-amber-300">Located near Chase Up Shopping Center.</p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-white/15 space-y-2">
              <Clock className="w-6 h-6 text-emerald-400" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hours
              </div>
              <div className="text-sm sm:text-base font-black text-white">
                Monday - Saturday: 10:00 AM - 6:00 PM
              </div>
              <p className="text-xs text-slate-400">Evening online batches till 11:00 PM</p>
            </div>
          </div>

          {/* Split Contact Form + Interactive October 2026 Batch Calendar (Matching pakgermanacademy.com/contact/) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Direct Inquiry Form */}
            <div className="lg:col-span-7 rounded-3xl glass-card border border-white/15 p-7 sm:p-8 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Reach Out to Us Today!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  It&apos;s Time to Take Control of Your Language Journey!
                </h2>
              </div>

              {!contactSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSent(true);
                    showToast('Message sent to Pak German Academy Gujranwala!');
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={contactData.name}
                        onChange={(e) =>
                          setContactData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+92 309 8556348"
                        value={contactData.phone}
                        onChange={(e) =>
                          setContactData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={contactData.email}
                      onChange={(e) =>
                        setContactData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Batch or Consultancy Inquiry
                    </label>
                    <input
                      type="text"
                      value={contactData.subject}
                      onChange={(e) =>
                        setContactData((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about your target German level (A1–B2) or Visa goal..."
                      value={contactData.message}
                      onChange={(e) =>
                        setContactData((prev) => ({ ...prev, message: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all"
                  >
                    Join Now & Send Inquiry
                  </button>
                </form>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-400/40 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-black text-white">Inquiry Received!</h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Our Gujranwala admissions desk (+92 309 8556348) will reach out to you shortly regarding{' '}
                    <span className="text-amber-300 font-semibold">{contactData.subject}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSent(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 text-white"
                  >
                    Send Another Message
                  </button>
                </div>
              )}
            </div>

            {/* Right: Interactive October 2026 Batch & Campus Visit Calendar */}
            <div className="lg:col-span-5 rounded-3xl glass-card border border-white/15 p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    Interactive Batch Calendar
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">October 2026</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  19 Oct Intake Highlighted
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const isBatchDay = day === 12 || day === 19 || day === 26;
                  const isSelected = selectedCalendarDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedCalendarDay(day);
                        setContactData((prev) => ({
                          ...prev,
                          subject: `Campus Visit / Batch Inquiry — ${day} October 2026`,
                        }));
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all relative ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 shadow-lg'
                          : isBatchDay
                          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                          : 'bg-slate-900/70 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-xs">
                <div className="font-bold text-amber-300">
                  Selected Date: {selectedCalendarDay} October 2026
                </div>
                <p className="text-slate-300">
                  {selectedCalendarDay === 19
                    ? 'Major Batch Launch Day! A1 On Campus (Afternoon), Online A1 (Morning & Afternoon), Online A2 (Evening), and Online B1 (Evening) start on 19 Oct 26.'
                    : selectedCalendarDay === 26
                    ? 'A2 On-Campus Morning Batch (11:00 AM – 1:00 PM) starts on 26 Oct 26.'
                    : 'Walk-in counseling and level placement available 10:00 AM – 6:00 PM at Civic Center Basement Shop No. 108, Gujranwala.'}
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================
          PAGE VIEW 10: TERMS AND CONDITIONS PAGE
         ======================================================================== */}
      {currentPage === 'terms' && (
        <main className="relative z-10 py-12 md:py-20 px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Pak German Academy • Policies
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              Terms And Conditions
            </h1>
            <p className="text-sm text-slate-400">
              Official enrollment, batch scheduling, and visa consultancy policies for Pak German Academy Gujranwala & Online.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: '1. Course Enrollment & Seat Reservation',
                body: 'Admissions are confirmed on a first-come, first-served basis for On-Campus (Civic Center Basement Shop No. 108, Gujranwala) and Live Online batches. Students may switch between Hybrid Pro and Online modes with prior notice to the academic desk.',
              },
              {
                title: '2. Curriculum, Attendance & Mock Exams',
                body: 'All A1, A2, B1, and B2 courses follow CEFR standards preparing students for Goethe-Institut, TELC, and ÖSD examinations. Regular attendance in speaking labs, weekly quizzes, and mock examinations is required to receive the final certificate of completion.',
              },
              {
                title: '3. Visa Consultancy Services (Study, Ausbildung & Family Reunion)',
                body: 'Pak German Academy provides complete documentation guidance, university application management, Sperrkonto assistance, and embassy interview preparation. Final visa issuance rests with the German Embassy / Consulate and Ausländerbehörde.',
              },
            ].map((sec) => (
              <div
                key={sec.title}
                className="p-6 rounded-3xl glass-card border border-white/15 space-y-2"
              >
                <h2 className="text-lg font-black text-white">{sec.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sec.body}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================================
          GLOBAL FOOTER (With Quick Links to All Pages + Required Verbatim Details)
         ======================================================================== */}
      <footer
        ref={footerRef}
        id="contact"
        className="relative z-10 pt-16 pb-14 px-4 sm:px-8 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl mt-12"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Callout Banner */}
          <div className="rounded-3xl glass-card border border-white/15 p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-gradient-to-tr from-red-600/25 to-amber-400/25 blur-3xl pointer-events-none" />
            <div className="space-y-2 max-w-2xl relative z-10">
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-400">
                Smart Learning. Confident Speaking. Start Today!
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-white">
                Have Questions? We&apos;re Here to Help You!
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Thank you for exploring our PakGerman Academy through the lens. Call +92 309 8556348 or join our upcoming 19 Oct 26 batches.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setAdmissionsPopupOpen(true)}
                className="px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>View 19 Oct 26 Batches</span>
              </button>
              <button
                type="button"
                onClick={() => openEnrollWithPreset()}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Enroll Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSetupModalOpen(true)}
                className="px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm glass-panel border border-white/20 text-slate-200 hover:border-amber-400/60 transition-all flex items-center gap-2"
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Vite Local Setup Info</span>
              </button>
            </div>
          </div>

          {/* Multi-Column Sitemap Footer (Matches pakgermanacademy.com Footer Structure) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="text-lg font-black text-white">PAK GERMAN ACADEMY</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Where Language Expertise Meets Learning Excellence. Professional German language training (A1–B2) and visa consultancy in Gujranwala & Online.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Quick Links
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'about', label: 'About' },
                  { id: 'results', label: 'Results' },
                  { id: 'courses', label: 'Our Courses' },
                  { id: 'contact', label: 'Contact' },
                  { id: 'terms', label: 'Terms And Conditions' },
                ].map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => navigateToPage(link.id)}
                      className="hover:text-amber-300 transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-red-400">
                Our Courses
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                {[
                  { id: 'a1', label: 'A1 – Beginner Level' },
                  { id: 'a2', label: 'A2 – Elementary Level' },
                  { id: 'b1', label: 'B1 – Intermediate Level' },
                  { id: 'b2', label: 'B2 – Upper Intermediate Level' },
                ].map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => navigateToPage(c.id)}
                      className="hover:text-amber-300 transition-colors"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Contact Details
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-white">A :</strong> Office No. 108, Civic Center, Basement Main GT Rd, Zahid Colony Shaheenabad, Gujranwala, 52250
                </p>
                <p>
                  <strong className="text-white">P :</strong> +92 309 8556348
                </p>
                <p>
                  <strong className="text-white">E :</strong> pakgermanacademy@gmail.com
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Contact Copy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <button
              type="button"
              onClick={() =>
                copyTextSafely('Civic Center Basement Shop No. 108, Gujranwala', () =>
                  showToast('Campus address copied to clipboard!')
                )
              }
              className="p-5 rounded-2xl glass-card border border-white/10 hover:border-amber-400/50 text-left transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gujranwala Campus
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white mt-1">
                    Civic Center Basement Shop No. 108, Gujranwala
                  </div>
                </div>
              </div>
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 mt-1" />
            </button>

            <button
              type="button"
              onClick={() =>
                copyTextSafely('+92 309 8556348', () =>
                  showToast('Phone number +92 309 8556348 copied!')
                )
              }
              className="p-5 rounded-2xl glass-card border border-white/10 hover:border-red-400/50 text-left transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Direct Hotline & WhatsApp
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white mt-1">
                    +92 309 8556348
                  </div>
                </div>
              </div>
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-red-400 shrink-0 mt-1" />
            </button>

            <button
              type="button"
              onClick={() =>
                copyTextSafely('pakgermanacademy@gmail.com', () =>
                  showToast('Email pakgermanacademy@gmail.com copied!')
                )
              }
              className="p-5 rounded-2xl glass-card border border-white/10 hover:border-amber-400/50 text-left transition-all group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Official Admissions Desk
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white mt-1 break-all">
                    pakgermanacademy@gmail.com
                  </div>
                </div>
              </div>
              <Copy className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 mt-1" />
            </button>
          </div>

          {/* Exact Verbatim Footer Line */}
          <div className="pt-8 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
            <p className="font-semibold text-slate-200 text-center lg:text-left">
              Civic Center Basement Shop No. 108, Gujranwala | +92 309 8556348 | pakgermanacademy@gmail.com
            </p>
            <p className="text-xs text-slate-500">
              © 2026 PakGermanAcademy. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ========================================================================
          OPENING POPUP MODAL: "🟢 Admissions are now Open!"
          Remade from the user's screenshot (image_f2c7a0.png) in 2026 Dark Agency Vibe
         ======================================================================== */}
      {admissionsPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-3xl rounded-3xl glass-panel border border-white/20 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.9)] relative"
          >
            {/* Top German Flag Neon Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-neutral-950 via-red-600 to-amber-400" />

            {/* Top-Right Close Button (×) */}
            <button
              type="button"
              onClick={() => setAdmissionsPopupOpen(false)}
              aria-label="Close this module"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-white/15 border border-white/15 flex items-center justify-center text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
              {/* Left Column: Collaborative Students Visual (Matching Screenshot Layout) */}
              <div className="md:col-span-5 relative min-h-[220px] md:min-h-full overflow-hidden bg-slate-900">
                <img
                  src={POPUP_IMAGE}
                  alt="Students learning German together at Pak German Academy"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl glass-panel border border-white/15 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Gujranwala & Live Online
                  </div>
                  <div className="text-xs font-bold text-white">
                    Interactive Speaking Labs & Goethe Exam Prep
                  </div>
                </div>
              </div>

              {/* Right Column: Verbatim "Admissions are now Open!" Content & Batch Selector */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 items-center justify-center shrink-0">
                      <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Admissions are now Open!
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-amber-300 leading-relaxed">
                    Master German with Pak German Academy – New Batches Starting Soon!
                  </p>

                  {/* Interactive Batch List (Exact 5 Batches from User's Screenshot) */}
                  <div className="space-y-2 pt-1">
                    {POPUP_BATCHES.map((batch) => {
                      const isSelected = selectedPopupBatch.id === batch.id;
                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() => setSelectedPopupBatch(batch)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-amber-400/15 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                              : 'bg-slate-900/75 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-medium">
                            {batch.name} —{' '}
                            <strong className="font-extrabold text-amber-300">
                              {batch.date}
                            </strong>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons: "Join Now" + "No thanks, I'm not interested!" */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAdmissionsPopupOpen(false);
                      openEnrollWithPreset(
                        selectedPopupBatch.course,
                        selectedPopupBatch.mode,
                        undefined,
                        selectedPopupBatch.label
                      );
                    }}
                    className="px-7 py-3.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-red-600 via-red-500 to-amber-400 text-slate-950 hover:brightness-110 transition-all shadow-[0_10px_25px_rgba(239,68,68,0.45)] flex items-center gap-2"
                  >
                    <span>Join Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdmissionsPopupOpen(false)}
                    className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    No thanks, I&apos;m not interested!
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================
          MODAL 1: ENROLLMENT & VISA CONSULTATION DRAWER
         ======================================================================== */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-3xl glass-panel border border-white/20 p-6 sm:p-8 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {!enrollSubmitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEnrollSubmitted(true);
                  showToast('Application registered for Pak German Academy!');
                }}
                className="space-y-4"
              >
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Pak German Academy • Priority Seat Reservation</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Reserve Your Batch or Visa Session
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Ali Hassan"
                      value={enrollForm.name}
                      onChange={(e) =>
                        setEnrollForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+92 309 8556348"
                      value={enrollForm.phone}
                      onChange={(e) =>
                        setEnrollForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Upcoming Batch (19 Oct 26 Intake)
                  </label>
                  <select
                    value={enrollForm.batch}
                    onChange={(e) =>
                      setEnrollForm((prev) => ({ ...prev, batch: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {POPUP_BATCHES.map((b) => (
                      <option key={b.id} value={b.label}>
                        {b.label}
                      </option>
                    ))}
                    <option value="B2 – Upper Intermediate Batch">
                      B2 – Upper Intermediate Batch
                    </option>
                    <option value="1-on-1 Private Customized Coaching">
                      1-on-1 Private Customized Coaching
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Course Level
                    </label>
                    <select
                      value={enrollForm.course}
                      onChange={(e) =>
                        setEnrollForm((prev) => ({ ...prev, course: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      {COURSES.map((c) => (
                        <option key={c.id} value={c.title}>
                          {c.title}
                        </option>
                      ))}
                      <option value="1v1 Private German Coaching">
                        1v1 Private German Coaching
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Visa Pathway Interest
                    </label>
                    <select
                      value={enrollForm.visaInterest}
                      onChange={(e) =>
                        setEnrollForm((prev) => ({
                          ...prev,
                          visaInterest: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      {VISA_SERVICES.map((v) => (
                        <option key={v.id} value={v.title}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 hover:brightness-110 transition-all shadow-lg"
                >
                  Confirm Priority Enrollment
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400 text-amber-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">
                  Vielen Dank, {enrollForm.name || 'Future Scholar'}!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your priority registration for{' '}
                  <span className="text-amber-300 font-bold">{enrollForm.batch}</span> (
                  {enrollForm.course}) and{' '}
                  <span className="text-red-400 font-bold">{enrollForm.visaInterest}</span>{' '}
                  advisory has been logged.
                </p>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 space-y-1">
                  <div>Campus: Civic Center Basement Shop No. 108, Gujranwala</div>
                  <div>Direct Line: +92 309 8556348 | pakgermanacademy@gmail.com</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white"
                >
                  Back to Website
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ========================================================================
          MODAL 2: INTERACTIVE CEFR PLACEMENT QUIZ
         ======================================================================== */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl glass-panel border border-white/20 p-6 sm:p-8 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setQuizOpen(false)}
              aria-label="Close quiz"
              className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {!quizResult ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400 pr-8">
                  <span>CEFR German Placement Diagnostic</span>
                  <span>
                    Question {quizStep + 1} of {QUIZ_QUESTIONS.length}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {QUIZ_QUESTIONS[quizStep].q}
                </h3>
                <div className="space-y-2.5">
                  {QUIZ_QUESTIONS[quizStep].options.map((opt, idx) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleQuizAnswer(idx)}
                      className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-amber-400/15 border border-white/10 hover:border-amber-400/60 text-left text-sm font-medium text-slate-200 hover:text-white transition-all flex items-center justify-between"
                    >
                      <span>{opt}</span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-center py-4">
                <div className="inline-flex px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-xs font-bold text-amber-300">
                  Score: {quizResult.score} / {QUIZ_QUESTIONS.length}
                </div>
                <h3 className="text-2xl font-black text-white">
                  Recommended Track: {quizResult.recommended.title}
                </h3>
                <p className="text-sm text-slate-300">
                  {quizResult.recommended.description}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuizOpen(false);
                      navigateToPage(quizResult.recommended.pageId);
                    }}
                    className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-600 to-amber-500 text-slate-950"
                  >
                    Open {quizResult.recommended.code} Course Page
                  </button>
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="px-4 py-3 rounded-xl font-bold text-xs bg-white/10 text-white"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ========================================================================
          MODAL 3: LOCAL VITE SETUP INSTRUCTIONS
         ======================================================================== */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl glass-panel border border-white/20 p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setSetupModalOpen(false)}
              aria-label="Close setup info"
              className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Local Vite + Tailwind + Framer Motion Runner
            </div>
            <h3 className="text-xl font-black text-white">
              Run Pak German Academy Locally
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Unzip the accompanying Vite project archive or run the included{' '}
              <code className="text-amber-300">setup.mjs</code> script:
            </p>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs text-amber-300 overflow-x-auto font-mono">
{`# Option 1: Using the provided Vite project zip
unzip pak-german-academy-vite.zip -d pak-german-academy
cd pak-german-academy
npm install
npm run dev

# Option 2: Using the single-file Node setup script inside the zip
node setup.mjs
npm install && npm run dev`}
            </pre>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl glass-panel border border-amber-400/50 text-xs sm:text-sm font-bold text-white shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
