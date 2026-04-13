import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a professional cosmetic chemist specializing in HOT PROCESS natural soap formulation.

Your task is to generate a COMPLETE, production-ready soap formula based on user input.

CORE CALCULATION  
Oil weight (g) = mold volume (ml) × 0.9  

Follow all best practices and return clean HTML output.`;

const SOAP_CONCEPTS = [
  "Sensitive Skin", "Luxury / Anti-aging", "Acne-fighting",
  "Baby Bar", "Moisturising", "Exfoliating", "Charcoal Detox",
  "Brightening", "Beard Bar", "Unscented / Fragrance-free"
];

const OIL_OPTIONS = [
  "Olive Oil", "Coconut Oil", "Palm Oil", "Shea Butter",
  "Cocoa Butter", "Mango Butter", "Castor Oil", "Sunflower Oil",
  "Sweet Almond Oil", "Avocado Oil", "Rice Bran Oil", "Jojoba Oil"
];

const EO_OPTIONS = [
  "Lavender", "Peppermint", "Tea Tree", "Eucalyptus",
  "Rose", "Jasmine", "Vanilla", "Lemon", "Orange",
  "Frankincense", "Cedarwood", "Ylang Ylang", "None / Unscented"
];

export default function SoapApp() {
  const [step, setStep] = useState(0);
  const [concept, setConcept] = useState("");
  const [moldVolume, setMoldVolume] = useState("");
  const [selectedOils, setSelectedOils] = useState([]);
  const [selectedEOs, setSelectedEOs] = useState([]);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  function toggleOil(oil) {
    setSelectedOils(prev =>
      prev.includes(oil) ? prev.filter(o => o !== oil) : [...prev, oil]
    );
  }

  function toggleEO(eo) {
    setSelectedEOs(prev =>
      prev.includes(eo) ? prev.filter(e => e !== eo) : [...prev, eo]
    );
  }

  async function generate() {
    if (!concept || !moldVolume) {
      setError("Fill all fields");
      return;
    }

    setError("");
    setStep(1);

    const userPrompt = `
Soap concept: ${concept}
Mold volume: ${moldVolume} ml
Oils: ${selectedOils.join(", ") || "auto"}
EOs: ${selectedEOs.join(", ") || "auto"}
`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: userPrompt
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      const text = data.content
        ?.filter(b => b.type === "text")
        .map(b => b.text)
        .join("") || "";

      setResult(text);
      setStep(2);
    } catch (err) {
      setError(err.message);
      setStep(0);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Soap Generator</h1>

      {step === 0 && (
        <>
          <h3>Concept</h3>
          {SOAP_CONCEPTS.map(c => (
            <button key={c} onClick={() => setConcept(c)}>
              {c}
            </button>
          ))}

          <h3>Mold Volume (ml)</h3>
          <input
            value={moldVolume}
            onChange={e => setMoldVolume(e.target.value)}
          />

          <h3>Oils</h3>
          {OIL_OPTIONS.map(o => (
            <button key={o} onClick={() => toggleOil(o)}>
              {o}
            </button>
          ))}

          <h3>Essential Oils</h3>
          {EO_OPTIONS.map(e => (
            <button key={e} onClick={() => toggleEO(e)}>
              {e}
            </button>
          ))}

          <br /><br />
          <button onClick={generate}>Generate</button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}

      {step === 1 && <p>Generating...</p>}

      {step === 2 && (
        <div ref={resultRef}>
          <div dangerouslySetInnerHTML={{ __html: result }} />
        </div>
      )}
    </div>
  );
}
