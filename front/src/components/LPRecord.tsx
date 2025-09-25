import React from "react";

const LPRecord: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes wiggle {
          0% { transform: rotate(0); }
          100% { transform: rotate(0.5deg); }
        }
        
        @keyframes zoom {
          0% {
            opacity: 0.5;
            transform: scale(1.4);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0.5;
            transform: scale(1) rotate(360deg);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0); }
          100% { transform: rotate(360deg); }
        }
        
        .lp-record {
          position: relative;
          width: 20em;
          height: 20em;
          background: 
            /* dark areas on both ends */
            radial-gradient(circle closest-side, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 35.5%, rgba(0,0,0,0) 96%, rgba(0,0,0,1) 96.5%),
            /* tracks */
            radial-gradient(circle closest-side, 
              rgba(0,0,0,0) 29.8%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 30.1%, rgba(0,0,0,0) 30.3%,
              rgba(0,0,0,0) 39.8%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 40.1%, rgba(0,0,0,0) 40.3%,
              rgba(0,0,0,0) 49.8%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3) 50.1%, rgba(0,0,0,0) 50.3%,
              rgba(0,0,0,0) 59.8%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.3) 60.1%, rgba(0,0,0,0) 60.3%,
              rgba(0,0,0,0) 69.8%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.3) 70.1%, rgba(0,0,0,0) 70.3%,
              rgba(0,0,0,0) 79.8%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.3) 80.1%, rgba(0,0,0,0) 80.3%,
              rgba(0,0,0,0) 89.8%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0.3) 90.1%, rgba(0,0,0,0) 90.3%
            ),
            /* highlight */
            conic-gradient(black 40deg, #eef 42deg, black 44deg, black 219deg, #eef 222deg, #eef 223deg, black 228deg),
            /* grooves */
            repeating-radial-gradient(
              transparent 0px, black 1px, transparent 2px, transparent 3px, black 4px, transparent 5px,
              transparent 6px, black 7px, transparent 8px, transparent 9px, black 10px, transparent 11px,
              transparent 12px, black 13px, transparent 14px, transparent 15px, black 16px, transparent 17px,
              transparent 18px, black 19px, transparent 20px, transparent 21px, black 22px, transparent 23px,
              transparent 24px, black 25px, transparent 26px, transparent 27px, black 28px, transparent 29px,
              transparent 30px, black 31px, transparent 32px, transparent 33px, black 34px, transparent 35px,
              transparent 36px, black 37px, transparent 38px, transparent 39px, black 40px, transparent 41px,
              transparent 42px, black 43px, transparent 44px, transparent 45px, black 46px, transparent 47px,
              transparent 48px, black 49px, transparent 50px, transparent 51px, black 52px, transparent 53px,
              transparent 54px, black 55px, transparent 56px, transparent 57px, black 58px, transparent 59px,
              transparent 60px, black 61px, transparent 62px, transparent 63px, black 64px, transparent 65px,
              transparent 66px, black 67px, transparent 68px, transparent 69px, black 70px, transparent 71px
            ),
            /* weak lighting */
            conic-gradient(
              rgba(255,255,255,0) 80deg,
              rgba(255,255,255,0.04) 90deg,
              rgba(255,255,255,0) 95deg,
              rgba(255,255,255,0) 260deg,
              rgba(255,255,255,0.04) 270deg,
              rgba(255,255,255,0) 285deg
            ),
            /* strong lighting */
            conic-gradient(
              rgba(255,255,255,0),
              rgba(255,255,255,0.22) 20deg,
              rgba(255,255,255,0.29) 40deg,
              rgba(255,255,255,0) 70deg,
              rgba(255,255,255,0) 180deg,
              rgba(255,255,255,0.18) 200deg,
              rgba(255,255,255,0.15) 210deg,
              rgba(255,255,255,0) 250deg
            ),
            black;
          background-blend-mode: normal, normal, color-dodge, normal, normal;
          animation: wiggle 30ms linear infinite alternate;
          border-radius: 100%;
          overflow: hidden;
        }
        
        .lp-record::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background: repeating-radial-gradient(
            transparent 0px, black 1px, transparent 2px, transparent 3px, black 4px, transparent 5px,
            transparent 6px, black 7px, transparent 8px, transparent 9px, black 10px, transparent 11px,
            transparent 12px, black 13px, transparent 14px, transparent 15px, black 16px, transparent 17px,
            transparent 18px, black 19px, transparent 20px, transparent 21px, black 22px, transparent 23px,
            transparent 24px, black 25px, transparent 26px, transparent 27px, black 28px, transparent 29px,
            transparent 30px, black 31px, transparent 32px, transparent 33px, black 34px, transparent 35px,
            transparent 36px, black 37px, transparent 38px, transparent 39px, black 40px, transparent 41px,
            transparent 42px, black 43px, transparent 44px, transparent 45px, black 46px, transparent 47px,
            transparent 48px, black 49px, transparent 50px, transparent 51px, black 52px, transparent 53px,
            transparent 54px, black 55px, transparent 56px, transparent 57px, black 58px, transparent 59px,
            transparent 60px, black 61px, transparent 62px, transparent 63px, black 64px, transparent 65px,
            transparent 66px, black 67px, transparent 68px, transparent 69px, black 70px, transparent 71px
          );
          border-radius: 100%;
          animation: zoom 1.79s linear infinite;
        }
        
        .lp-record::after {
          content: "";
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 30%;
          height: 30%;
          margin-left: -15%;
          margin-top: -15%;
          border-radius: 100%;
          color: #dde;
          text-align: center;
          line-height: 3em;
          font-weight: bold;
          font-size: 0.8em;
          background: radial-gradient(circle closest-side, #eaeaee 8%, rgba(234,234,238,0) 9%, transparent 85%, #dde 85%, #dde 90%, transparent 90%),
            conic-gradient(rgb(77,67,145) 25%, rgb(207,75,145) 0 50%, rgb(77,67,145) 0 75%, rgb(207,75,145) 0);
          background-size: 100%, 3em 3em;
          animation: spin 1.79s linear infinite;
        }

        .album-cover {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 60%;
          height: 60%;
          margin-left: -30%;
          margin-top: -30%;
          border-radius: 100%;
          object-fit: cover;
          z-index: 2;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <div className="lp-record"></div>
    </>
  );
};

export default LPRecord;
