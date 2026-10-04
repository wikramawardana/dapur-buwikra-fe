import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type {
  FlyerTemplateStyle,
  ParsedMenuData,
} from "@/types/menu-generator.types";

function getLogoBase64(): string {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public/image/dapur-buwikra-logo-sm.png",
    );
    if (fs.existsSync(logoPath)) {
      const b64 = fs.readFileSync(logoPath).toString("base64");
      return `data:image/png;base64,${b64}`;
    }
  } catch (err) {
    console.warn("Could not load logo as base64:", err);
  }
  return "";
}

/**
 * Renders the Yellow Bento Flyer (1024x1280) - Matching Canva Sample #1
 */
function renderBentoYellow(
  data: ParsedMenuData,
  logoSrc: string,
  photoSrc?: string,
) {
  const { title, dishes, description, tagline, price_label } = data;

  return (
    <div
      style={{
        width: 1024,
        height: 1280,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#E5AA38",
        padding: "36px 48px",
        fontFamily: "sans-serif",
        position: "relative",
        boxSizing: "border-box",
        justifyContent: "space-between",
      }}
    >
      {/* ── TOP HEADER ── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Dapur Bu Wikra"
            style={{ width: 150, height: 150, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1e3d29",
              display: "flex",
            }}
          >
            DAPUR BU WIKRA
          </div>
        )}

        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: "bold",
            color: "#1e3d29",
            letterSpacing: "0.5px",
          }}
        >
          https://dapurbuwikra.wikra.cloud/
        </div>
      </div>

      {/* ── HEADLINE ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: -10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 58,
            fontWeight: 900,
            color: "#1e3d29",
            letterSpacing: "1px",
            display: "flex",
          }}
        >
          {title || "Menu Hari Ini"}
        </div>
      </div>

      {/* ── CENTER AREA: BENTO BOX & POINTER LABELS ── */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: 640,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* TOP-LEFT LABEL & ARROW */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: 220,
            zIndex: 10,
          }}
        >
          {/* Curved SVG Arrow Pointing Down-Right */}
          <svg width="60" height="40" viewBox="0 0 60 40">
            <path
              d="M 5,5 Q 35,5 50,35"
              fill="none"
              stroke="#1e3d29"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="53,35 43,30 48,22" fill="#1e3d29" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              color: "#1e3d29",
              marginTop: 4,
              lineHeight: 1.2,
            }}
          >
            {dishes.main}
          </div>
        </div>

        {/* TOP-RIGHT LABEL & ARROW */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            maxWidth: 220,
            zIndex: 10,
          }}
        >
          {/* Curved SVG Arrow Pointing Down-Left */}
          <svg width="60" height="40" viewBox="0 0 60 40">
            <path
              d="M 55,5 Q 25,5 10,35"
              fill="none"
              stroke="#1e3d29"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="7,35 17,30 12,22" fill="#1e3d29" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              color: "#1e3d29",
              marginTop: 4,
              textAlign: "right",
              lineHeight: 1.2,
            }}
          >
            {dishes.carbs}
          </div>
        </div>

        {/* BOTTOM-LEFT LABEL & ARROW */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: 220,
            zIndex: 10,
          }}
        >
          {/* Curved SVG Arrow Pointing Up-Right */}
          <svg width="60" height="40" viewBox="0 0 60 40">
            <path
              d="M 5,35 Q 35,35 50,5"
              fill="none"
              stroke="#1e3d29"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="53,5 43,10 48,18" fill="#1e3d29" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              color: "#1e3d29",
              marginTop: 4,
              lineHeight: 1.2,
            }}
          >
            {dishes.condiment}
          </div>
        </div>

        {/* BOTTOM-RIGHT LABEL & ARROW */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            maxWidth: 220,
            zIndex: 10,
          }}
        >
          {/* Curved SVG Arrow Pointing Up-Left */}
          <svg width="60" height="40" viewBox="0 0 60 40">
            <path
              d="M 55,35 Q 25,35 10,5"
              fill="none"
              stroke="#1e3d29"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="7,5 17,10 12,18" fill="#1e3d29" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              color: "#1e3d29",
              marginTop: 4,
              textAlign: "right",
              lineHeight: 1.2,
            }}
          >
            {dishes.side}
          </div>
        </div>

        {/* ── BENTO CONTAINER ── */}
        <div
          style={{
            width: 530,
            height: 480,
            backgroundColor: "#FFFFFF",
            borderRadius: 36,
            padding: 16,
            display: "flex",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            border: "8px solid #FDFBF7",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Bento Meal"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 24,
              }}
            />
          ) : (
            /* Bento 4-Compartment Graphic */
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                gap: 12,
              }}
            >
              {/* Left Column (Main dish top, Side/Sambal bottom) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "50%",
                  gap: 12,
                }}
              >
                {/* Main Dish Compartment */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "58%",
                    backgroundColor: "#FFF5EB",
                    borderRadius: 20,
                    border: "3px solid #FBD38D",
                    padding: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 36, marginBottom: 4, display: "flex" }}
                  >
                    🍲
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#9C4221",
                      display: "flex",
                      textAlign: "center",
                    }}
                  >
                    {dishes.main}
                  </div>
                </div>

                {/* Bottom Left Compartments (Sambal & Side) */}
                <div style={{ display: "flex", height: "42%", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "50%",
                      backgroundColor: "#FFF5F5",
                      borderRadius: 16,
                      border: "3px solid #FEB2B2",
                      padding: 8,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ fontSize: 24, display: "flex" }}>🌶️</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "#9B2C2C",
                        display: "flex",
                        textAlign: "center",
                      }}
                    >
                      {dishes.condiment}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "50%",
                      backgroundColor: "#FFFFF0",
                      borderRadius: 16,
                      border: "3px solid #FAF089",
                      padding: 8,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ fontSize: 24, display: "flex" }}>🥢</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "#975A16",
                        display: "flex",
                        textAlign: "center",
                      }}
                    >
                      {dishes.side}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Rice / Carbs Compartment) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "50%",
                  backgroundColor: "#F7FAFC",
                  borderRadius: 20,
                  border: "3px solid #E2E8F0",
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 6, display: "flex" }}>
                  🍚
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#2D3748",
                    display: "flex",
                    textAlign: "center",
                  }}
                >
                  {dishes.carbs}
                </div>
                {/* Cute post-it note at bottom right of container */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    backgroundColor: "#FFDEE9",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: "bold",
                    color: "#D53F8C",
                    transform: "rotate(-4deg)",
                    display: "flex",
                  }}
                >
                  enjoy! ♥
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM FOOTER ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 20,
            lineHeight: 1.4,
            color: "#1e3d29",
            fontWeight: 500,
            textAlign: "center",
            display: "flex",
          }}
        >
          {description}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#1e3d29",
              color: "#FFFFFF",
              padding: "14px 40px",
              borderRadius: 40,
              fontSize: 26,
              fontWeight: "bold",
              letterSpacing: "1px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {tagline || "Nikmat, Sehat, Hemat"}
          </div>

          {price_label && (
            <div
              style={{
                display: "flex",
                backgroundColor: "#C53030",
                color: "#FFFFFF",
                padding: "14px 28px",
                borderRadius: 40,
                fontSize: 26,
                fontWeight: 900,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {price_label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the "Makan Apa Hari Ini" Orange Poster (1000x1000) - Matching Canva Sample #2
 */
function renderMakanApaOrange(
  data: ParsedMenuData,
  logoSrc: string,
  photoSrc?: string,
) {
  const { dishes, price_label } = data;
  const priceDisplay =
    price_label ||
    (data.price ? `CUMA ${Math.round(data.price / 1000)}K` : "CUMA 25K");

  return (
    <div
      style={{
        width: 1000,
        height: 1000,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F77F00",
        padding: "36px 40px",
        fontFamily: "sans-serif",
        position: "relative",
        boxSizing: "border-box",
        justifyContent: "space-between",
      }}
    >
      {/* ── TOP BANNER ROW ── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* Letter Blocks: MAKAN APA HARI INI? */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Row 1: M A K A N */}
          <div style={{ display: "flex", gap: 8 }}>
            {["M", "A", "K", "A", "N"].map((letter, i) => (
              <div
                key={`makan-${i}`}
                style={{
                  display: "flex",
                  width: 54,
                  height: 54,
                  backgroundColor: "#780000",
                  color: "#FFFFFF",
                  fontSize: 32,
                  fontWeight: 900,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                }}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Row 2: A P A */}
          <div style={{ display: "flex", gap: 8, marginLeft: 30 }}>
            {["A", "P", "A"].map((letter, i) => (
              <div
                key={`apa-${i}`}
                style={{
                  display: "flex",
                  width: 54,
                  height: 54,
                  backgroundColor: "#780000",
                  color: "#FFFFFF",
                  fontSize: 32,
                  fontWeight: 900,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                }}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Row 3: HARI INI? */}
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "2px",
              marginLeft: 10,
              textShadow: "2px 2px 0px rgba(0,0,0,0.2)",
            }}
          >
            HARI INI?
          </div>
        </div>

        {/* Mascot Logo on Top Right */}
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Dapur Bu Wikra"
            style={{ width: 170, height: 170, objectFit: "contain" }}
          />
        )}
      </div>

      {/* ── CURVED RED BANNER ── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -10,
        }}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: "#780000",
            color: "#FFE6A7",
            padding: "10px 48px",
            borderRadius: 30,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "1px",
            boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
          }}
        >
          DAPUR BU WIKRA PILIHAN TEPAT!
        </div>
      </div>

      {/* ── CENTER MEAL PHOTO / BENTO ── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 480,
          backgroundColor: "#FFFFFF",
          borderRadius: 32,
          padding: 14,
          position: "relative",
          boxShadow: "0 16px 32px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {photoSrc ? (
          <img
            src={photoSrc}
            alt="Meal Bento"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 22,
            }}
          />
        ) : (
          /* Dish Showcase Grid */
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              flexDirection: "column",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", width: "100%", height: "55%", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "55%",
                  backgroundColor: "#FFF5EB",
                  borderRadius: 20,
                  border: "3px solid #FBD38D",
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 4, display: "flex" }}>
                  🍗
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#780000",
                    display: "flex",
                    textAlign: "center",
                  }}
                >
                  {dishes.main}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "45%",
                  backgroundColor: "#F7FAFC",
                  borderRadius: 20,
                  border: "3px solid #E2E8F0",
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 4, display: "flex" }}>
                  🍚
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#2D3748",
                    display: "flex",
                    textAlign: "center",
                  }}
                >
                  {dishes.carbs}
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", width: "100%", height: "42%", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "50%",
                  backgroundColor: "#FFFFF0",
                  borderRadius: 18,
                  border: "3px solid #FAF089",
                  padding: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 28, display: "flex" }}>🥢</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#975A16",
                    display: "flex",
                    textAlign: "center",
                  }}
                >
                  {dishes.side}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "50%",
                  backgroundColor: "#FFF5F5",
                  borderRadius: 18,
                  border: "3px solid #FEB2B2",
                  padding: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 28, display: "flex" }}>🌶️</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#9B2C2C",
                    display: "flex",
                    textAlign: "center",
                  }}
                >
                  {dishes.condiment}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM ACCENTS: PRICE BADGE & POST-IT ── */}
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
        }}
      >
        {/* Price Star Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#780000",
            color: "#FFFFFF",
            padding: "16px 28px",
            borderRadius: 24,
            fontSize: 24,
            fontWeight: 900,
            boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
            border: "4px solid #FFE6A7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {priceDisplay}
        </div>

        {/* Post-it Enjoy note */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#FF758F",
            color: "#FFFFFF",
            padding: "10px 24px",
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 800,
            transform: "rotate(-3deg)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        >
          enjoy! (◕‿◕)
        </div>
      </div>
    </div>
  );
}

/**
 * Main generator function that returns an ImageResponse with the chosen style
 */
export async function generateMenuFlyerImage(
  data: ParsedMenuData,
  style: FlyerTemplateStyle = "bento_yellow",
  photoSrc?: string,
): Promise<ImageResponse> {
  const logoBase64 = getLogoBase64();

  if (style === "makan_apa_orange") {
    return new ImageResponse(renderMakanApaOrange(data, logoBase64, photoSrc), {
      width: 1000,
      height: 1000,
    });
  }

  return new ImageResponse(renderBentoYellow(data, logoBase64, photoSrc), {
    width: 1024,
    height: 1280,
  });
}
