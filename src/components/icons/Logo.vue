<template>
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <!-- 黑色渐变 -->
            <linearGradient id="blackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#222222; stop-opacity:1" />
                <stop offset="50%" style="stop-color:#000000; stop-opacity:1" />
                <stop offset="100%" style="stop-color:#222222; stop-opacity:1" />
            </linearGradient>

            <!-- 红色渐变 -->
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#ff3333; stop-opacity:1" />
                <stop offset="50%" style="stop-color:#cc0000; stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ff3333; stop-opacity:1" />
            </linearGradient>

            <!-- 红色高光 -->
            <linearGradient id="redHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#ff6666; stop-opacity:0.8" />
                <stop offset="50%" style="stop-color:#ff0000; stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ff6666; stop-opacity:0.8" />
            </linearGradient>

            <!-- 阴影效果 -->
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3" />
            </filter>

            <!-- 莫比乌斯带路径 -->
            <path id="mobiusPath" d="
                M 30,50
                C 30,30 50,20 70,30
                C 90,40 90,60 70,70
                C 50,80 30,70 30,50
                C 30,30 50,20 70,30
            " />
        </defs>

        <!-- 背景圆形 -->
        <circle cx="50" cy="50" r="48" fill="#f8f8f8" stroke="#e0e0e0" stroke-width="0.5" />

        <!-- 8字型莫比乌斯带主体 - 黑色 -->
        <path d="
            M 30,50
            C 30,30 50,20 70,30
            C 90,40 90,60 70,70
            C 50,80 30,70 30,50
            Z
        " fill="url(#blackGradient)" stroke="#000000" stroke-width="2" filter="url(#shadow)" />

        <!-- 8字型莫比乌斯带内环 - 红色 -->
        <path d="
            M 35,50
            C 35,35 50,27 65,35
            C 80,43 80,57 65,65
            C 50,73 35,65 35,50
            Z
        " fill="url(#redGradient)" stroke="#cc0000" stroke-width="1.5" />

        <!-- 红色高光线 -->
        <path d="
            M 38,50
            C 38,38 50,32 62,38
            C 74,44 74,56 62,62
            C 50,68 38,62 38,50
        " fill="none" stroke="url(#redHighlight)" stroke-width="2" stroke-linecap="round" />

        <!-- 莫比乌斯带扭转效果 - 黑色部分 -->
        <path d="
            M 40,48
            C 45,35 55,28 65,32
            C 75,36 78,44 75,52
        " fill="none" stroke="#000000" stroke-width="1.2" stroke-dasharray="4,3" />

        <!-- 莫比乌斯带扭转效果 - 红色部分 -->
        <path d="
            M 40,52
            C 45,65 55,72 65,68
            C 75,64 78,56 75,48
        " fill="none" stroke="#ff0000" stroke-width="1.2" stroke-dasharray="4,3" />

        <!-- 中心交叉点 -->
        <circle cx="50" cy="50" r="3" fill="#ff0000" stroke="#ffffff" stroke-width="1" />
        <circle cx="50" cy="50" r="1" fill="#ffffff" />

        <!-- 流动效果箭头 -->
        <g transform="translate(50, 50)">
            <path d="M -15,0 L -5,-3 L -5,3 Z" fill="#ff0000" stroke="#ffffff" stroke-width="0.5" />
            <path d="M 15,0 L 5,3 L 5,-3 Z" fill="#ff0000" stroke="#ffffff" stroke-width="0.5" />
        </g>

        <!-- 无限符号装饰 -->
        <text x="50" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#666666"
            font-weight="bold">
            ∞
        </text>
    </svg>
</template>
