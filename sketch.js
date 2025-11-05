// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn;

// 원 색상 변수
let circleColor = [255, 0, 0]; // 기본값: Red

function setup() {
  createCanvas(windowWidth, windowHeight);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // 색상 변경 버튼들
  let button1 = createButton("1");
  button1.mousePressed(() => {
    changeColor('red');
    sendNumber(1);
  });
  button1.size(60, 40);
  button1.position(20, 100);

  let button2 = createButton("2");
  button2.mousePressed(() => {
    changeColor('green');
    sendNumber(2);
  });
  button2.size(60, 40);
  button2.position(90, 100);

  let button3 = createButton("3");
  button3.mousePressed(() => {
    changeColor('blue');
    sendNumber(3);
  });
  button3.size(60, 40);
  button3.position(160, 100);
}

function draw() {
  background(240);
  
  // 중앙에 원 그리기
  fill(circleColor[0], circleColor[1], circleColor[2]);
  noStroke();
  circle(width / 2, height / 2, 200);
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
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    statusP.html("Status: Error - " + e);
    console.error(e);
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
