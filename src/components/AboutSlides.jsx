import { useEffect, useRef } from "react";
import gsap from "gsap";

export const CommerceSuccess = () => {
    const capRef = useRef(null);
    const diplomaRef = useRef(null);
    const starRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(capRef.current, {
                y: -15,
                rotation: 5,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
            });
            gsap.to(diplomaRef.current, {
                rotation: -5,
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
            gsap.to(".star", {
                scale: 1.5,
                opacity: 0.5,
                duration: 1,
                stagger: 0.2,
                repeat: -1,
                yoyo: true,
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-blue/10 to-white">
            <svg
                viewBox="0 0 800 600"
                className="absolute inset-0 h-full w-full opacity-20"
            >
                <pattern
                    id="pattern-circles"
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    <circle cx="2" cy="2" r="1" className="text-blue fill-current" />
                </pattern>
                <rect x="0" y="0" width="800" height="600" fill="url(#pattern-circles)" />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
                <svg
                    width="400"
                    height="400"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-2xl"
                >
                    {/* Graduation Cap */}
                    <g ref={capRef} className="origin-center">
                        <path
                            d="M20 70 L100 30 L180 70 L100 110 Z"
                            fill="#1a1a2e"
                            stroke="#FFD43B"
                            strokeWidth="2"
                        />
                        <path
                            d="M100 110 V140 C100 160 180 160 180 70"
                            fill="none" // Hidden part usually, simplified cap
                        />
                        <path
                            d="M170 75 V110"
                            stroke="#FFD43B"
                            strokeWidth="2"
                        />
                        <circle cx="170" cy="110" r="4" fill="#FF6B6B" /> {/* Tassel end */}
                    </g>

                    {/* Cap Base */}
                    <path
                        d="M50 85 V110 C50 125 150 125 150 110 V85"
                        fill="#1a1a2e"
                    />

                    {/* Diploma */}
                    <g ref={diplomaRef} className="origin-center" transform="translate(40, 120) rotate(15)">
                        <rect x="0" y="0" width="100" height="30" rx="4" fill="#ffffff" stroke="#e5e5e5" strokeWidth="1" />
                        <rect x="40" y="-5" width="10" height="40" fill="#FF6B6B" /> {/* Ribbon */}
                        <circle cx="45" cy="15" r="8" fill="#FFD43B" /> {/* Seal */}
                    </g>

                    {/* Stars */}
                    <g ref={starRef}>
                        <path className="star" d="M100 10 L105 25 L120 25 L110 35 L115 50 L100 40 L85 50 L90 35 L80 25 L95 25 Z" fill="#FFD43B" transform="translate(-40, -10) scale(0.5)" />
                        <path className="star" d="M100 10 L105 25 L120 25 L110 35 L115 50 L100 40 L85 50 L90 35 L80 25 L95 25 Z" fill="#FF6B6B" transform="translate(60, 20) scale(0.4)" />
                    </g>
                </svg>
            </div>
        </div>
    );
};

export const BoardPrep = () => {
    const stackRef = useRef(null);
    const penRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(penRef.current, {
                x: 10,
                y: 5,
                rotation: 5,
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });
            gsap.fromTo(".book",
                { x: -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "back.out(1.7)" }
            );
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-bl from-coral/10 to-white">
            <div className="absolute inset-0 flex items-center justify-center">
                <svg
                    width="400"
                    height="400"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Books Stack */}
                    <g ref={stackRef}>
                        <rect className="book" x="40" y="140" width="120" height="20" rx="2" fill="#3B5BDB" />
                        <rect x="42" y="145" width="116" height="10" fill="white" opacity="0.2" />

                        <rect className="book" x="50" y="115" width="100" height="20" rx="2" fill="#FF6B6B" />
                        <rect x="52" y="120" width="96" height="10" fill="white" opacity="0.2" />

                        <rect className="book" x="60" y="90" width="80" height="20" rx="2" fill="#1a1a2e" />
                        <rect x="62" y="95" width="76" height="10" fill="white" opacity="0.2" />
                    </g>

                    {/* Pen */}
                    <g ref={penRef} transform="translate(140, 50) rotate(-15)">
                        <rect x="0" y="0" width="10" height="80" rx="2" fill="#FFD43B" />
                        <path d="M0 80 L5 95 L10 80 Z" fill="#333" />
                        <rect x="0" y="5" width="10" height="20" fill="black" opacity="0.1" />
                    </g>
                </svg>
            </div>
        </div>
    );
};

export const LiveLearning = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(".wifi-signal",
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1.2, duration: 1.5, repeat: -1, stagger: 0.3, ease: "power1.out" }
            );
            gsap.to(".screen-content", {
                opacity: 0.8,
                duration: 2,
                repeat: -1,
                yoyo: true
            })
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-tr from-blue/5 to-white">
            <div className="absolute inset-0 flex items-center justify-center">
                <svg
                    width="450"
                    height="400"
                    viewBox="0 0 300 300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Laptop Base */}
                    <path d="M40 220 L260 220 L270 240 L30 240 Z" fill="#e2e8f0" />
                    <rect x="30" y="240" width="240" height="10" rx="2" fill="#cbd5e1" />

                    {/* Screen */}
                    <rect x="50" y="60" width="200" height="150" rx="8" fill="#1a1a2e" />
                    <rect x="60" y="70" width="180" height="130" fill="#3B5BDB" opacity="0.2" />

                    {/* Screen Content */}
                    <g className="screen-content">
                        <rect x="70" y="80" width="80" height="50" rx="4" fill="#FF6B6B" opacity="0.8" />
                        <rect x="160" y="80" width="70" height="10" rx="2" fill="white" opacity="0.5" />
                        <rect x="160" y="100" width="50" height="10" rx="2" fill="white" opacity="0.3" />
                        <circle cx="210" cy="170" r="15" fill="#FFD43B" />
                    </g>

                    {/* Wifi Signals */}
                    <g transform="translate(150, 40)">
                        <path className="wifi-signal" d="M-20 -10 C-10 -20 10 -20 20 -10" stroke="#3B5BDB" strokeWidth="4" strokeLinecap="round" opacity="0" />
                        <path className="wifi-signal" d="M-30 -20 C-15 -35 15 -35 30 -20" stroke="#3B5BDB" strokeWidth="4" strokeLinecap="round" opacity="0" />
                        <path className="wifi-signal" d="M-40 -30 C-20 -50 20 -50 40 -30" stroke="#3B5BDB" strokeWidth="4" strokeLinecap="round" opacity="0" />
                    </g>
                </svg>
            </div>
        </div>
    );
};

export const ConfidenceGrowth = () => {
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(".bar",
                { height: 0 },
                { height: (i, target) => target.getAttribute("data-height"), duration: 1.5, stagger: 0.2, ease: "power2.out" }
            );
            gsap.to(".arrow", {
                strokeDashoffset: 0,
                duration: 2,
                ease: "power1.inOut"
            })
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-mint/10 to-white">
            <div className="absolute inset-0 flex items-center justify-center">
                <svg
                    width="400"
                    height="400"
                    viewBox="0 0 300 300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Chart Axes */}
                    <path d="M50 50 V250 H250" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round" />

                    {/* Bars */}
                    <rect className="bar" x="70" y="250" width="30" height="0" data-height="60" transform="translate(0, -60)" fill="#e2e8f0" />
                    <rect className="bar" x="120" y="250" width="30" height="0" data-height="100" transform="translate(0, -100)" fill="#93c5fd" />
                    <rect className="bar" x="170" y="250" width="30" height="0" data-height="150" transform="translate(0, -150)" fill="#3B5BDB" />
                    <rect className="bar" x="220" y="250" width="30" height="0" data-height="190" transform="translate(0, -190)" fill="#FFD43B" />

                    {/* Growth Arrow */}
                    <path className="arrow" d="M70 200 L120 160 L170 110 L240 50" stroke="#FF6B6B" strokeWidth="6" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="300" />
                    <path className="arrow" d="M230 50 L240 50 L240 65" stroke="#FF6B6B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="100" />

                    {/* Person/Avatar Idea (Simple) */}
                    <circle cx="40" cy="40" r="20" fill="#FFD43B" opacity="0.1" />
                </svg>
            </div>
        </div>
    );
}
