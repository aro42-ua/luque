window.Hero = (function () {
  var preloader = null;
  var MIN_PRELOADER_TIME = 1200; // ms
  var startTime = 0;

  function hidePreloader(){
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_PRELOADER_TIME - elapsed);
    gsap.delayedCall(remaining / 1000, () => {
      gsap.to(preloader, {
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => {
          preloader.style.display = 'none';
          document.body.classList.add('preloader-done');
          // [NUEVO] Al terminar la carga aparece el logo "Fin de
          // carga" (fase A del hero), sin necesidad de scroll y con
          // el mismo tamaño que el logo de carga del preloader.
          gsap.to('#heroIntro', { opacity: 1, duration: 0.6, ease: 'power2.out' });
        }
      });
    });
  }

  function init() {
    /* ================================================================
       1) PRELOADER
       ================================================================ */
    preloader = document.getElementById('preloader');
    startTime = Date.now();
    window.addEventListener('load', hidePreloader);

    /* ================================================================
       2) HERO SCROLL SEQUENCE
       [MODIFICADO] El spacer mide ahora 200vh y define dos tramos:
         - Tramo 1 (scroll 0 -> 100vh): crossfade fase A ("Fin de
           carga") -> fase B (Logotipo Luque! en grande). Este timeline
           solo cubre este tramo (end:'+=100%' = 1 viewport).
         - Tramo 2 (scroll 100vh -> 200vh): el Logotipo Luque queda
           fijo mientras la galería (en flujo, tras el spacer) sube y
           cubre el hero por completo.
       ================================================================ */
    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#heroSpacer',
        start: 'top top',
        end: '+=100%',   // primeros 100vh de los 200vh del spacer
        scrub: 0.6
      }
    });

    heroTimeline
      .to('#heroIntro', {
        opacity: 0,
        y: -40,
        scale: 0.85,
        duration: 1,
        ease: 'power1.in'
      }, 0)
      .fromTo('#heroMain',
        { opacity: 0, y: 40, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' },
        0.15
      );

    /* ================================================================
       2b) [NUEVO] SNAP ANTI-ATASCO
       Cubre todo el recorrido de la intro (0 -> 200vh, es decir, todo
       el spacer) y engancha el scroll a tres posiciones estables:
         0.0 -> logo "Fin de carga"
         0.5 -> Logotipo Luque! completo (scroll = 100vh)
         1.0 -> galería cubriendo el hero por completo (scroll = 200vh)
       Si el usuario suelta el scroll a medias entre el Logotipo Luque
       y la galería, GSAP lo lleva automáticamente al punto estable más
       cercano: es imposible quedarse con las dos secciones cortadas.
       ================================================================ */
    ScrollTrigger.create({
      trigger: '#heroSpacer',
      start: 'top top',
      end: 'bottom top',   // los 200vh completos del spacer
      snap: {
        snapTo: [0, 0.5, 1],
        duration: { min: 0.25, max: 0.7 },
        delay: 0.05,
        ease: 'power2.inOut'
      }
    });
  }

  return { init: init };
})();
