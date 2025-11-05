// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn;

// 원 색상 변수
let circleColor = [255, 0, 0]; // 기본값: Red

// 가속도 센서 관련 변수
let accelBtn, accelStatusP, accelTextP;
let accelX = 0, accelY = 0, accelZ = 0;
let accelActive = false;

// 굴러다니는 원 관련 변수
let ballX, ballY;
let ballVx = 0, ballVy = 0; // 속도
const ballRadius = 10; // 지름 20이므로 반지름 10
let ballRotation = 0; // 회전 각도

function setup() {
  createCanvas(windowWidth, windowHeight);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // send1, send2, send3 버튼들 (색상 변경 + 전송)
  let send1Btn = createButton("send1");
  send1Btn.mousePressed(() => {
    changeColor('red');
    sendNumber(1);
  });
  send1Btn.size(80, 40);
  send1Btn.position(20, 100);

  let send2Btn = createButton("send2");
  send2Btn.mousePressed(() => {
    changeColor('green');
    sendNumber(2);
  });
  send2Btn.size(80, 40);
  send2Btn.position(110, 100);

  let send3Btn = createButton("send3");
  send3Btn.mousePressed(() => {
    changeColor('blue');
    sendNumber(3);
  });
  send3Btn.size(80, 40);
  send3Btn.position(200, 100);

  // 가속도 센서 활성화 버튼
  accelBtn = createButton("Enable Accelerometer");
  accelBtn.mousePressed(enableAccelerometer);
  accelBtn.size(150, 30);
  accelBtn.position(20, 150);

  accelStatusP = createP("Accelerometer: Not enabled");
  accelStatusP.position(22, 170);

  accelTextP = createP("X: 0.00, Y: 0.00, Z: 0.00");
  accelTextP.position(22, 190);

  // 굴러다니는 원 초기 위치 (캔버스 중앙)
  ballX = width / 2;
  ballY = height / 2;
}

function draw() {
  background(240);
  
  // 중앙에 큰 원 그리기
  fill(circleColor[0], circleColor[1], circleColor[2]);
  noStroke();
  circle(width / 2, height / 2, 200);

  // 가속도에 따라 굴러다니는 원 업데이트
  if (accelActive) {
    // 가속도를 속도에 적용 (마찰 고려)
    const friction = 0.95; // 마찰 계수
    const sensitivity = 0.5; // 가속도 감도
    
    // X축 가속도 (화면 좌우)
    ballVx += accelX * sensitivity;
    ballVy += accelY * sensitivity;
    
    // 가속도에 따른 회전 각도 업데이트 (기울어지는 효과)
    ballRotation += accelX * 0.1;
    
    // 마찰 적용
    ballVx *= friction;
    ballVy *= friction;
    
    // 위치 업데이트
    ballX += ballVx;
    ballY += ballVy;
    
    // 경계 체크 (원이 화면 밖으로 나가지 않도록)
    if (ballX < ballRadius) {
      ballX = ballRadius;
      ballVx *= -0.8; // 반발
    }
    if (ballX > width - ballRadius) {
      ballX = width - ballRadius;
      ballVx *= -0.8;
    }
    if (ballY < ballRadius) {
      ballY = ballRadius;
      ballVy *= -0.8;
    }
    if (ballY > height - ballRadius) {
      ballY = height - ballRadius;
      ballVy *= -0.8;
    }
  }

  // 굴러다니는 파란색 원 그리기 (지름 20, 기울어지는 효과)
  push();
  translate(ballX, ballY);
  rotate(ballRotation);
  fill(0, 0, 255); // 파란색
  noStroke();
  circle(0, 0, ballRadius * 2);
  // 원의 방향 표시를 위한 작은 선
  stroke(255);
  strokeWeight(2);
  line(0, 0, ballRadius, 0);
  pop();
}

// 색상 변경 함수
function changeColor(colorName) {
  if (colorName === 'red') {
    circleColor = [255, 0, 0]; // Red
  } else if (colorName === 'green') {
    circleColor = [0, 255, 0]; // Green
  } else if (colorName === 'blue') {
    circleColor = [0, 0, 255]; // Blue
  }
}

// ---- BLE Connect ----
async function connectAny() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: "Youmin nano" },
        { namePrefix: "Youmin nano" }
      ],
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    // 장치 이름으로 찾지 못한 경우 모든 장치에서 검색
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      writeChar = await service.getCharacteristic(WRITE_UUID);
      statusP.html("Status: Connected to " + (device.name || "device"));
    } catch (e2) {
      statusP.html("Status: Error - " + e2);
      console.error(e2);
    }
  }
}

// ---- Write 1 byte to BLE ----
async function sendNumber(n) {
  if (!writeChar) {
    statusP.html("Status: Not connected");
    return;
  }
  try {
    await writeChar.writeValue(new Uint8Array([n & 0xff]));
    statusP.html("Status: Sent " + n);
  } catch (e) {
    statusP.html("Status: Write error - " + e);
  }
}

// ---- 가속도 센서 활성화 ----
function enableAccelerometer() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ 권한 요청
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          setupAccelerometer();
        } else {
          accelStatusP.html("Accelerometer: Permission denied");
        }
      })
      .catch(console.error);
  } else {
    // 다른 브라우저 또는 권한 요청이 필요 없는 경우
    setupAccelerometer();
  }
}

function setupAccelerometer() {
  // 가속도 이벤트 리스너
  window.addEventListener('devicemotion', handleMotion);
  accelActive = true;
  accelStatusP.html("Accelerometer: Enabled");
}

function handleMotion(event) {
  if (event.accelerationIncludingGravity) {
    // 가속도 값 읽기 (중력 포함)
    accelX = event.accelerationIncludingGravity.x || 0;
    accelY = event.accelerationIncludingGravity.y || 0;
    accelZ = event.accelerationIncludingGravity.z || 0;
    
    // 텍스트 업데이트
    accelTextP.html(`X: ${accelX.toFixed(2)}, Y: ${accelY.toFixed(2)}, Z: ${accelZ.toFixed(2)}`);
  }
}
