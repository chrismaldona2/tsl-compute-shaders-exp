export default function Credits() {
  return (
    <div
      className={`fixed z-100 bottom-0 left-0 w-full px-4 py-3 text-xs sm:text-base text-white font-sans pointer-events-none`}
    >
      <div className="pointer-events-auto flex items-center justify-between">
        <div>
          Shader by{" "}
          <a
            href="https://x.com/chrismaldona2"
            target="_blank"
            className="underline"
          >
            Chris
          </a>{" "}
          &#40;
          <a
            href="https://github.com/chrismaldona2/tsl-compute-shaders-exp"
            target="_blank"
            className="underline"
          >
            Source Code
          </a>
          &#41;
        </div>

        <div>
          <a
            href="https://sketchfab.com/3d-models/lost-robot-5a5c314a82864818a3fa5a0f71b17990"
            target="_blank"
            className="underline"
          >
            Lost Robot
          </a>{" "}
          by{" "}
          <a
            href="https://sketchfab.com/Mikita_Hubanau"
            target="_blank"
            className="underline"
          >
            Mikita Hubanau
          </a>
        </div>
      </div>
    </div>
  );
}
