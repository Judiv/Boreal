"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Zap, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import styles from "./chatbot.module.css";
import { askMistral } from "./actions";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // ✅ État pour le son
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Salut ! Je suis Boreal AI. Je connais tout sur la vie à l'Usine. Pose-moi une question ! 🎓" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "C'est quand la prochaine fête ?",
    "Dernières news ?",
    "C'est quoi Borgia ?",
    "Aide-moi pour le site"
  ];

  // ✅ SYNTHÈSE VOCALE (TTS)
  const speak = (text: string) => {
    if (isMuted || typeof window === "undefined") return;
    
    // Annule les lectures en cours pour éviter les chevauchements
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.1; // Un peu plus rapide pour paraître naturel
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // --- RECONNAISSANCE VOCALE (STT) ---
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Reconnaissance vocale non supportée sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // ✅ CONFIGURATION OPTIMALE
    recognition.lang = 'fr-FR';
    recognition.continuous = false; // On s'arrête dès qu'on a une phrase
    recognition.interimResults = true; // On affiche le texte pendant qu'on parle

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Micro actif...");
    };

    recognition.onresult = (event: any) => {
      // On récupère le dernier résultat capté
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      setInput(transcript); // On met à jour l'input en temps réel
      console.log("Transcript en cours:", transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Erreur STT:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert("Micro bloqué ! Clique sur le cadenas dans la barre d'adresse et autorise le microphone.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Micro coupé.");
    };

    try {
      recognition.start();
    } catch (e) {
      // Si on essaie de lancer alors qu'il tourne déjà
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askMistral(text);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      
      // ✅ ON FAIT PARLER L'IA
      speak(response);

    } catch (err) {
      const errorMsg = "Désolé, Mistral ne répond pas à l'Usine...";
      setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
      speak(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.statusDot} />
            <span className={styles.botName}>Boreal AI</span>
            
            {/* ✅ BOUTON MUTE/UNMUTE */}
            <button 
              onClick={() => {
                setIsMuted(!isMuted);
                window.speechSynthesis.cancel();
              }} 
              className={styles.headerIconBtn}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}><X size={18} /></button>
          </div>

          <div className={styles.messages} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.userRow : styles.botRow}>
                <div className={styles.bubble}>{m.content}</div>
              </div>
            ))}
            
            {!isLoading && messages.length < 3 && (
              <div className={styles.suggestionGrid}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className={styles.suggestionBtn}>
                    <Zap size={10} /> {s}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className={styles.botRow}>
                <div className={styles.bubble}>
                  <Sparkles className={styles.spin} size={14} /> Réflexion...
                </div>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            {/* MICROPHONE */}
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Clic Micro détecté !");
                startListening();
              }} 
              className={`${styles.micBtn} ${isListening ? styles.micActive : ""}`}
              aria-label="Activer le micro"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Je t'écoute..." : "Pose ta question..."}
              className={styles.chatInput}
            />

            {/* BOUTON ENVOYER */}
            <button 
              type="button"
              onClick={() => handleSend()} 
              className={styles.sendBtn}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button className={`${styles.launcher} ${isOpen ? styles.launcherActive : ""}`} onClick={() => setIsOpen(!isOpen)}>
        <MessageSquare size={24} />
      </button>
    </div>
  );
}