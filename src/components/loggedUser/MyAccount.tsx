import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "../../redux/slices/UserSlice";
import { useNavigate } from "react-router";
import { RootState } from "../../redux/store";
import { motion, AnimatePresence } from "framer-motion";

export default function MyAccount(): React.ReactNode {
  const [newUsername, setNewUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("RSD");

  const JWT = localStorage.getItem("insajder_token");
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const dispatch = useDispatch();

  const currencies = ["RSD", "EUR", "BAM"];

  useEffect(() => {
    setSelectedCurrency(currentUser?.defaultCurrency || "RSD");
  }, [currentUser]);

  const saveChanges = useCallback(() => {
    setError(null);
    if (!newUsername || newUsername.length < 4 || newUsername === currentUser?.username) {
      setError("Ime mora biti duže od 3 karaktera.");
      return;
    }

    fetch("/updateName", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
      body: JSON.stringify({ newName: newUsername, oldName: currentUser?.username }),
    })
      .then((res) => {
        if (res.ok) {
          dispatch(setUser({ ...currentUser, username: newUsername }));
          setError("Uspešno: Korisničko ime promenjeno!");
          setNewUsername("");
        } else setError("Greška pri ažuriranju imena.");
      })
      .catch(() => setError("Greška u komunikaciji sa serverom."));
  }, [newUsername, currentUser, dispatch, JWT]);

  const saveCurrency = async (val: string) => {
    setSelectedCurrency(val);
    setIsCurrencyOpen(false);
    try {
      const res = await fetch("/api/user/currency", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
        body: JSON.stringify({ currency: val }),
      });
      if (res.ok) {
        dispatch(setUser({ ...currentUser, defaultCurrency: val }));
        setError(`Uspešno: Valuta postavljena na ${val}`);
      }
    } catch (err) {
      setError("Neuspešno ažuriranje valute");
    }
  };

  const handleConfirmReset = async () => {
    setLoadingReset(true);
    try {
      const response = await fetch("/resetStatistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
      });
      if (response.ok) setError("Uspešno: Statistika resetovana!");
    } catch (err) {
      setError("Greška pri resetovanju.");
    } finally {
      setLoadingReset(false);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-[#030712] text-slate-200 selection:bg-cyan-500/30">
      <div className="w-full max-w-6xl relative">
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" 
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: MINI PROFILE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-4 space-y-4">
            <div className="bg-gray-900/40 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-10 flex flex-col items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-b from-gray-800 to-gray-950 p-[2px] shadow-2xl">
                  <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center overflow-hidden relative">
                    <svg className="w-14 h-14 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-cyan-500 rounded-full border-[6px] border-[#0d111c] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>

              <h2 className="mt-8 text-3xl font-black text-white tracking-tighter uppercase">{currentUser?.username}</h2>
              <p className="text-gray-500 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">{currentUser?.email}</p>

              <div className="w-full grid grid-cols-2 gap-4 mt-10">
                <div className="bg-black/40 rounded-[1.5rem] p-4 border border-white/[0.05] text-center">
                  <span className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Status</span>
                  <span className={`text-xs font-black uppercase ${currentUser?.tier === 'premium' ? 'text-amber-400' : 'text-cyan-400'}`}>{currentUser?.tier}</span>
                </div>
                <div className="bg-black/40 rounded-[1.5rem] p-4 border border-white/[0.05] text-center">
                  <span className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Valuta</span>
                  <span className="text-xs font-black text-white uppercase">{currentUser?.defaultCurrency || 'RSD'}</span>
                </div>
              </div>
            </div>

            <button onClick={() => dispatch(logout())} className="w-full py-5 rounded-[2rem] bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/20 text-gray-500 hover:text-red-500 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group">
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Odjavi se
            </button>
          </motion.div>

          {/* RIGHT COLUMN: MAIN SETTINGS */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8">
            <div className="bg-gray-900/40 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-white/[0.05] flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Podešavanja</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Personalizacija vašeg iskustva</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>

              <div className="p-10 space-y-12">
                {/* Username Section */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-5 block">Promena imena</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Novo korisničko ime..."
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 bg-black/60 border border-white/[0.05] rounded-2xl py-5 px-6 text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-all font-bold"
                    />
                    <button onClick={saveChanges} className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest px-10 py-5 rounded-2xl transition-all shadow-[0_10px_20px_-5px_rgba(6,182,212,0.4)] active:scale-95">
                      Ažuriraj
                    </button>
                  </div>
                </div>

                {/* PREMIUM: Custom Currency Dropdown */}
                {currentUser?.tier !== "free" && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-5 block">Valuta prikaza</label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                        className="w-full bg-black/60 border border-white/[0.05] rounded-2xl py-5 px-6 flex items-center justify-between cursor-pointer group transition-all hover:border-indigo-500/30"
                      >
                        <span className="font-black text-white tracking-widest uppercase">{selectedCurrency}</span>
                        <svg className={`w-5 h-5 text-indigo-500 transition-transform duration-300 ${isCurrencyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </div>

                      <AnimatePresence>
                        {isCurrencyOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 z-50 mt-2 bg-gray-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-3xl"
                          >
                            {currencies.map((cur) => (
                              <div
                                key={cur}
                                onClick={() => saveCurrency(cur)}
                                className="px-6 py-4 hover:bg-indigo-600/20 cursor-pointer transition-colors flex items-center justify-between group"
                              >
                                <span className={`font-black text-xs uppercase tracking-widest ${selectedCurrency === cur ? 'text-indigo-400' : 'text-gray-400'}`}>{cur}</span>
                                {selectedCurrency === cur && <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                {currentUser?.tier !== "free" && (
                  <div className="pt-8 border-t border-white/[0.05]">
                    <div className="bg-gradient-to-br from-amber-500/[0.03] to-transparent border border-amber-500/10 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <h4 className="text-amber-500 font-black uppercase tracking-widest text-[10px] mb-1">Resetuj statistiku</h4>
                        <p className="text-gray-500 text-xs font-medium">Ovo će trajno obrisati vašu statistiku.</p>
                      </div>
                      <button onClick={() => setShowConfirmModal(true)} className="w-full sm:w-auto px-10 py-4 bg-amber-500/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                        Resetuj
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#0d111c] border border-white/[0.05] rounded-[3rem] p-10 shadow-2xl text-center">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Potvrda</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">Statistika će biti obrisana zauvek. Da li želite da nastavite?</p>
              <div className="space-y-3">
                <button onClick={handleConfirmReset} disabled={loadingReset} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-amber-900/20">
                  {loadingReset ? "Resetujem..." : "Da, resetuj sve"}
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full text-gray-600 font-bold py-2 hover:text-white transition-colors text-xs uppercase tracking-widest">Odustani</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] px-8 py-5 rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex items-center gap-4 min-w-[350px] ${error.startsWith("Uspešno") ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${error.startsWith("Uspešno") ? "bg-cyan-500/20" : "bg-red-500/20"}`}>
              {error.startsWith("Uspešno") ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>}
            </div>
            <span className="font-black text-[11px] uppercase tracking-widest">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}