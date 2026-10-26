const fs = require('fs');
const path = 'c:/Users/USER/Desktop/Task Developer/client/src/styles/App.scss';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '  .kpi-grid {';
const endMarker   = '  .followup-row {';
const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Markers not found. start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const newBlock = `  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @keyframes kpi-shine {
    0%   { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(260%)  skewX(-12deg); }
  }

  .kpi-card {
    border-radius: 18px;
    padding: 1.4rem 1.5rem;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 160px;
    animation: kpi-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    transition: transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease;
    cursor: default;
    border: 1px solid rgba(255,255,255,0.18);

    /* shine sweep */
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
      transform: translateX(-120%) skewX(-12deg);
      pointer-events: none;
      z-index: 3;
    }
    &:hover::before { animation: kpi-shine 0.6s ease forwards; }

    /* top-right glow orb */
    &::after {
      content: '';
      position: absolute;
      top: -50px; right: -50px;
      width: 150px; height: 150px;
      border-radius: 50%;
      background: rgba(255,255,255,0.09);
      pointer-events: none;
    }

    &:hover {
      transform: translateY(-7px) scale(1.025);
      box-shadow: 0 24px 48px rgba(0,0,0,0.3) !important;
    }

    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: auto;
      backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    }

    .kpi-body {
      position: relative;
      z-index: 1;
      margin-top: 1rem;

      .kpi-value {
        font-size: 2rem;
        font-weight: 900;
        color: #FFFFFF;
        line-height: 1;
        letter-spacing: -0.03em;
        margin-bottom: 6px;
        text-shadow: 0 2px 20px rgba(0,0,0,0.2);
      }

      .kpi-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 0.6rem;
      }

      .kpi-trend {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.67rem;
        font-weight: 700;
        color: rgba(255,255,255,0.95);
        background: rgba(255,255,255,0.18);
        border: 1px solid rgba(255,255,255,0.28);
        padding: 3px 10px;
        border-radius: 9999px;
        backdrop-filter: blur(6px);
        white-space: nowrap;
      }
    }

    .kpi-accent { display: none; }
  }

`;

const result = content.slice(0, startIdx) + newBlock + content.slice(endIdx);
fs.writeFileSync(path, result, 'utf8');
console.log('Done. Length:', result.length);
