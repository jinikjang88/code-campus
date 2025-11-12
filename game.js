import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

// 게임 초기화
kaboom({
    width: 1280,
    height: 720,
    background: [245, 245, 250],
    crisp: true,
});

// 색상 팔레트
const COLORS = {
    grass: rgb(168, 218, 181),
    path: rgb(236, 239, 244),
    frontend: rgb(135, 206, 250),
    backend: rgb(144, 238, 144),
    database: rgb(255, 182, 193),
    player: rgb(255, 140, 0),
    npc: rgb(147, 112, 219),
};

// 메인 씬
scene("campus", () => {
    const CAM_ZOOM = 2;
    camScale(CAM_ZOOM);

    const MAP_WIDTH = 30;
    const MAP_HEIGHT = 20;
    const TILE_SIZE = 32;

    // 잔디 배경
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            add([
                rect(TILE_SIZE, TILE_SIZE),
                pos(x * TILE_SIZE, y * TILE_SIZE),
                color(COLORS.grass),
                opacity(0.3 + Math.random() * 0.2),
                z(-100),
            ]);
        }
    }

    // 경로 생성
    const paths = [
        { x: 5, y: 3, w: 2, h: 10 },
        { x: 5, y: 10, w: 15, h: 2 },
        { x: 18, y: 5, w: 2, h: 8 },
    ];

    paths.forEach(path => {
        for (let x = 0; x < path.w; x++) {
            for (let y = 0; y < path.h; y++) {
                add([
                    rect(TILE_SIZE, TILE_SIZE),
                    pos((path.x + x) * TILE_SIZE, (path.y + y) * TILE_SIZE),
                    color(COLORS.path),
                    z(-50),
                ]);
            }
        }
    });

    // 건물 생성 함수
    function createBuilding(x, y, width, height, col, label) {
        // 건물 그림자
        add([
            rect(width, height),
            pos(x + 4, y + 4),
            color(0, 0, 0),
            opacity(0.15),
            anchor("center"),
            z(y - 1),
        ]);

        // 건물
        const building = add([
            rect(width, height),
            pos(x, y),
            color(col),
            area(),
            outline(3, rgb(255, 255, 255)),
            anchor("center"),
            z(y),
            "building",
        ]);

        // 건물 라벨
        add([
            text(label, { size: 10 }),
            pos(x, y),
            color(255, 255, 255),
            anchor("center"),
            z(y + 1),
        ]);

        return building;
    }

    // 캠퍼스 건물들
    createBuilding(200, 200, 100, 80, COLORS.frontend, "Frontend");
    createBuilding(450, 300, 100, 80, COLORS.backend, "Backend");
    createBuilding(650, 200, 100, 80, COLORS.database, "Database");

    // 플레이어 캐릭터
    const player = add([
        circle(12),
        pos(150, 300),
        color(COLORS.player),
        area(),
        anchor("center"),
        outline(2, rgb(255, 255, 255)),
        z(300),
        "player",
        {
            speed: 120,
            name: "신입 개발자"
        }
    ]);

    // 플레이어 그림자 (circle로 대체)
    const playerShadow = add([
        circle(8),
        pos(player.pos.x, player.pos.y + 15),
        color(0, 0, 0),
        opacity(0.3),
        anchor("center"),
        z(299),
    ]);

    // NPC 생성
    function createNPC(x, y, npcName) {
        const npc = add([
            circle(12),
            pos(x, y),
            color(COLORS.npc),
            area(),
            anchor("center"),
            outline(2, rgb(255, 255, 255)),
            z(y),
            "npc",
            { name: npcName }
        ]);

        // NPC 이름 표시
        add([
            text(npcName, { size: 8 }),
            pos(x, y - 25),
            color(80, 80, 80),
            anchor("center"),
            z(y + 1),
        ]);

        return npc;
    }

    const seniorDev = createNPC(220, 150, "시니어 개발자");
    const mentor = createNPC(470, 250, "멘토");
    const dba = createNPC(670, 170, "DBA");

    // 키보드 입력
    onUpdate(() => {
        const speed = player.speed;
        let moveX = 0;
        let moveY = 0;

        // 입력 방향 수집
        if (isKeyDown("w") || isKeyDown("up")) {
            moveY -= 1;
        }
        if (isKeyDown("s") || isKeyDown("down")) {
            moveY += 1;
        }
        if (isKeyDown("a") || isKeyDown("left")) {
            moveX -= 1;
        }
        if (isKeyDown("d") || isKeyDown("right")) {
            moveX += 1;
        }

        // 벡터 정규화 (대각선 이동 속도 보정)
        if (moveX !== 0 || moveY !== 0) {
            const moveVec = vec2(moveX, moveY).unit();
            player.move(moveVec.scale(speed));
        }

        // z-index 업데이트
        player.z = player.pos.y;
        
        // 그림자 위치 업데이트
        playerShadow.pos = vec2(player.pos.x, player.pos.y + 15);
        playerShadow.z = player.z - 1;

        // 카메라 부드럽게 따라가기
        camPos(lerp(camPos(), player.pos, 0.1));
    });

    // NPC 상호작용
    let nearNPC = null;
    let interactionUI = [];

    onUpdate(() => {
        const npcs = get("npc");
        nearNPC = null;

        npcs.forEach(npc => {
            const dist = player.pos.dist(npc.pos);
            if (dist < 50) {
                nearNPC = npc;
            }
        });

        // UI 정리
        if (!nearNPC && interactionUI.length > 0) {
            interactionUI.forEach(ui => destroy(ui));
            interactionUI = [];
        }

        // UI 표시
        if (nearNPC && interactionUI.length === 0) {
            const bg = add([
                rect(140, 25),
                pos(player.pos.x, player.pos.y - 40),
                color(80, 80, 80),
                anchor("center"),
                opacity(0.8),
                z(1000),
            ]);

            const txt = add([
                text("E - 대화하기", { size: 12 }),
                pos(player.pos.x, player.pos.y - 40),
                color(255, 255, 255),
                anchor("center"),
                z(1001),
            ]);

            interactionUI.push(bg, txt);

            // UI가 플레이어 따라다니기
            bg.onUpdate(() => {
                bg.pos = vec2(player.pos.x, player.pos.y - 40);
            });
            txt.onUpdate(() => {
                txt.pos = vec2(player.pos.x, player.pos.y - 40);
            });
        }
    });

    // E키 상호작용
    onKeyPress("e", () => {
        if (nearNPC) {
            showDialogue(nearNPC.name);
        }
    });

    // 대화 시스템
    function showDialogue(npcName) {
        const dialogues = {
            "시니어 개발자": [
                "안녕! 첫 출근 축하해.",
                "Frontend 건물에서 UI/UX 기초를 배울 수 있어.",
                "먼저 React 컴포넌트 만들기부터 시작해볼까?"
            ],
            "멘토": [
                "Backend 개발의 핵심은 확장성이야.",
                "REST API 설계부터 차근차근 배워보자.",
                "오늘은 Spring Boot 기초 미션을 줄게!"
            ],
            "DBA": [
                "데이터베이스는 모든 것의 기초지.",
                "정규화부터 인덱싱까지 알려줄게.",
                "SQL 퀘스트를 완료하면 보상이 있어!"
            ]
        };

        const messages = dialogues[npcName] || ["안녕하세요!"];
        let currentMsg = 0;

        // 대화 박스
        const dialogBox = add([
            rect(600, 120),
            pos(width() / 2 / CAM_ZOOM, height() / 2 / CAM_ZOOM + 150),
            color(40, 40, 50),
            anchor("center"),
            opacity(0.95),
            outline(3, rgb(255, 255, 255)),
            z(2000),
        ]);

        const nameTag = add([
            text(npcName, { size: 14 }),
            pos(width() / 2 / CAM_ZOOM - 280, height() / 2 / CAM_ZOOM + 100),
            color(255, 200, 100),
            anchor("left"),
            z(2001),
        ]);

        const dialogText = add([
            text(messages[currentMsg], { size: 12, width: 560 }),
            pos(width() / 2 / CAM_ZOOM - 280, height() / 2 / CAM_ZOOM + 130),
            color(255, 255, 255),
            anchor("left"),
            z(2001),
        ]);

        const continueText = add([
            text("SPACE - 계속", { size: 10 }),
            pos(width() / 2 / CAM_ZOOM + 270, height() / 2 / CAM_ZOOM + 200),
            color(200, 200, 200),
            anchor("right"),
            z(2001),
        ]);

        const spaceHandler = onKeyPress("space", () => {
            currentMsg++;
            if (currentMsg < messages.length) {
                dialogText.text = messages[currentMsg];
            } else {
                destroy(dialogBox);
                destroy(nameTag);
                destroy(dialogText);
                destroy(continueText);
                spaceHandler.cancel();
            }
        });
    }

    // UI - 플레이어 정보
    add([
        rect(250, 60),
        pos(20, 20),
        color(255, 255, 255),
        opacity(0.9),
        outline(2, rgb(100, 100, 100)),
        z(1000),
    ]);

    add([
        text(player.name, { size: 14 }),
        pos(30, 30),
        color(80, 80, 80),
        z(1001),
    ]);

    add([
        text("Level 1 - 신입", { size: 10 }),
        pos(30, 50),
        color(120, 120, 120),
        z(1001),
    ]);

    // 조작 안내
    add([
        rect(200, 80),
        pos(width() / CAM_ZOOM - 220, 20),
        color(255, 255, 255),
        opacity(0.9),
        outline(2, rgb(100, 100, 100)),
        z(1000),
    ]);

    add([
        text("조작법", { size: 12 }),
        pos(width() / CAM_ZOOM - 210, 30),
        color(80, 80, 80),
        z(1001),
    ]);

    add([
        text("WASD / 화살표 - 이동\nE - 상호작용", { size: 10 }),
        pos(width() / CAM_ZOOM - 210, 50),
        color(120, 120, 120),
        z(1001),
    ]);

    // 웰컴 메시지
    wait(0.5, () => {
        const welcomeBox = add([
            rect(400, 100),
            pos(width() / 2 / CAM_ZOOM, height() / 2 / CAM_ZOOM - 100),
            color(100, 70, 200),
            anchor("center"),
            opacity(0.95),
            outline(3, rgb(255, 255, 255)),
            z(3000),
        ]);

        add([
            text("Code Campus에 오신 걸 환영합니다!", { size: 16 }),
            pos(width() / 2 / CAM_ZOOM, height() / 2 / CAM_ZOOM - 120),
            color(255, 255, 255),
            anchor("center"),
            z(3001),
        ]);

        add([
            text("첫 미션: 시니어 개발자와 대화하기", { size: 12 }),
            pos(width() / 2 / CAM_ZOOM, height() / 2 / CAM_ZOOM - 90),
            color(255, 200, 100),
            anchor("center"),
            z(3001),
        ]);

        wait(3, () => {
            destroy(welcomeBox);
        });
    });
});

// 게임 시작
go("campus");