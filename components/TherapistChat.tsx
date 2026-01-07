import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, HeartHandshake, Loader2, ImagePlus, X, Edit3, ChevronRight, ChevronLeft, Target, Heart, Users, Sparkles, Eye, BookOpen, ShieldAlert, History } from 'lucide-react';
import { streamTherapistAdvice } from '../services/geminiService';
import { saveTherapistSession, getTherapistSession } from '../services/dbService';
import { Logo } from './Logo';
import { TherapistMessage, ClinicalNotes, TherapistExercise, ExerciseType, Epiphany, PerspectiveInsight, PatternInsight, ProjectionInsight, ClosureScript, SafetyIntervention, ParentalPatternV2, ValuesMatrix } from '../types';
import { Clipboard, Shield, AlertTriangle, Users2, Scale } from 'lucide-react';

interface TherapistChatProps {
    onBack: () => void;
    firebaseUid?: string;
}

const DEFAULT_NOTES: ClinicalNotes = {
    attachmentStyle: 'unknown',
    keyThemes: [],
    emotionalState: undefined,
    relationshipDynamic: undefined,
    userInsights: [],
    actionItems: [],
    customNotes: ''
};

// Exercise Card Component
interface ExerciseCardProps {
    exercise: TherapistExercise;
    onComplete: (result: any) => void;
    onSkip: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onComplete, onSkip }) => {
    const [boundaryInputs, setBoundaryInputs] = useState<string[]>(['', '', '']);
    const [needsValues, setNeedsValues] = useState({ safety: 50, connection: 50, autonomy: 50 });
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

    const exerciseConfig = {
        boundary_builder: {
            icon: Target,
            title: 'Boundary Builder',
            color: 'rose',
            description: 'Define your non-negotiables'
        },
        needs_assessment: {
            icon: Heart,
            title: 'Needs Check-in',
            color: 'purple',
            description: 'How are your core needs being met?'
        },
        attachment_quiz: {
            icon: Users,
            title: 'Attachment Style',
            color: 'blue',
            description: 'Quick pattern check'
        }
    };

    const config = exerciseConfig[exercise.type];
    const Icon = config.icon;

    const handleSubmit = () => {
        let result;
        switch (exercise.type) {
            case 'boundary_builder':
                result = { boundaries: boundaryInputs.filter(b => b.trim()) };
                break;
            case 'needs_assessment':
                result = needsValues;
                break;
            case 'attachment_quiz':
                result = { answers: quizAnswers };
                break;
        }
        onComplete(result);
    };

    return (
        <div className="flex justify-start animate-fade-in w-full">
            <div className={`w-full max-w-md p-4 rounded-2xl bg-gradient-to-br from-${config.color}-500/10 to-${config.color}-600/5 border border-${config.color}-500/30 shadow-lg shadow-${config.color}-500/5`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-${config.color}-500/20 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 text-${config.color}-400`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">{config.title}</h3>
                        <p className="text-[10px] text-zinc-400">{config.description}</p>
                    </div>
                </div>

                <p className="text-xs text-zinc-300 mb-4 italic">"{exercise.context}"</p>

                {/* Boundary Builder UI */}
                {exercise.type === 'boundary_builder' && (
                    <div className="space-y-2">
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">What are 3 things you will NOT accept?</p>
                        {boundaryInputs.map((input, i) => (
                            <input
                                key={i}
                                type="text"
                                value={input}
                                onChange={(e) => {
                                    const newInputs = [...boundaryInputs];
                                    newInputs[i] = e.target.value;
                                    setBoundaryInputs(newInputs);
                                }}
                                placeholder={`Boundary ${i + 1}...`}
                                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
                            />
                        ))}
                    </div>
                )}

                {/* Needs Assessment UI */}
                {exercise.type === 'needs_assessment' && (
                    <div className="space-y-4">
                        {Object.entries(needsValues).map(([need, value]) => (
                            <div key={need}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-300 capitalize">{need}</span>
                                    <span className="text-zinc-500">{value}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={value}
                                    onChange={(e) => setNeedsValues({ ...needsValues, [need]: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Attachment Quiz UI */}
                {exercise.type === 'attachment_quiz' && (
                    <div className="space-y-3">
                        {[
                            'When my partner is distant, I often pursue them more.',
                            'I prefer keeping some emotional distance in relationships.',
                            'I feel comfortable depending on my partner.'
                        ].map((q, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className="flex gap-1 mt-0.5">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => {
                                                const newAnswers = [...quizAnswers];
                                                newAnswers[i] = n;
                                                setQuizAnswers(newAnswers);
                                            }}
                                            className={`w-5 h-5 rounded text-[10px] font-mono transition-colors ${quizAnswers[i] === n ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-400 flex-1">{q}</p>
                            </div>
                        ))}
                        <p className="text-[9px] text-zinc-600 text-right">1 = Not at all, 5 = Very much</p>
                    </div>
                )}

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onSkip}
                        className="flex-1 px-3 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-1 px-3 py-2 text-xs text-white bg-${config.color}-500/20 border border-${config.color}-500/40 rounded-lg hover:bg-${config.color}-500/30 transition-colors font-medium`}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

// Perspective Bridge Component
const PerspectiveCard: React.FC<{ insight: PerspectiveInsight }> = ({ insight }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className="w-full max-w-md p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Perspective Bridge</h3>
            </div>
            <div className="space-y-3">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase mb-1">Their Potential Inner View</p>
                    <p className="text-xs text-zinc-300 leading-relaxed italic">{insight.partnerPerspective}</p>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase mb-1">Suggested Motive/Wound</p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{insight.suggestedMotive}</p>
                </div>
            </div>
        </div>
    </div>
);

// Pattern Insight Component
const PatternCard: React.FC<{ insight: PatternInsight }> = ({ insight }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className="w-full max-w-md p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Masterclass Insight</h3>
            </div>
            <p className="text-sm font-bold text-white mb-2">{insight.patternName}</p>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{insight.explanation}</p>
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <p className="text-[10px] text-amber-400 uppercase font-bold mb-1">Try this instead:</p>
                <p className="text-xs text-amber-200">{insight.suggestion}</p>
            </div>
        </div>
    </div>
);

// Projection Flag Component
const ProjectionCard: React.FC<{ insight: ProjectionInsight }> = ({ insight }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className="w-full max-w-md p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider">Shadow Reflection</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
                Could your criticism of their <span className="text-violet-300 font-bold">{insight.behavior}</span> be a reflection of <span className="text-violet-300 italic">{insight.potentialRoot}</span> within yourself?
            </p>
        </div>
    </div>
);

// Closure Script Component
const ClosureCard: React.FC<{ script: ClosureScript }> = ({ script }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className="w-full max-w-md p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <Clipboard className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">The Final Word</h3>
                    <p className="text-[10px] text-zinc-400 capitalize">{script.tone.replace('_', ' ')} Tone</p>
                </div>
            </div>
            <div className="bg-black/30 p-4 rounded-lg border border-zinc-700/50 mb-3 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                "{script.script}"
            </div>
            <p className="text-xs text-zinc-500 italic mb-3">{script.explanation}</p>
            <button
                onClick={() => navigator.clipboard.writeText(script.script)}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs font-medium text-white transition-colors"
            >
                Copy to Clipboard
            </button>
        </div>
    </div>
);

// Safety Intervention Component
const SafetyCard: React.FC<{ safety: SafetyIntervention }> = ({ safety }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className={`w-full max-w-md p-5 rounded-2xl ${safety.level === 'crisis' ? 'bg-red-950/90 border-red-500/50' : 'bg-orange-950/90 border-orange-500/50'} border shadow-2xl backdrop-blur-md`}>
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className={`w-6 h-6 ${safety.level === 'crisis' ? 'text-red-400' : 'text-orange-400'}`} />
                <h3 className="text-lg font-bold text-white">Safety Pause</h3>
            </div>

            <p className="text-sm text-zinc-200 mb-4 font-medium">{safety.reason}</p>

            <div className="bg-black/20 p-4 rounded-xl mb-4">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Grounding Exercise</p>
                <p className="text-sm text-white leading-relaxed">{safety.calmDownText}</p>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Resources</p>
                {safety.resources.map((res, i) => (
                    <a key={i} href={res.url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg flex justify-between items-center transition-colors">
                        <span className="text-sm font-bold text-white">{res.name}</span>
                        {res.contact && <span className="text-xs text-zinc-300 font-mono">{res.contact}</span>}
                    </a>
                ))}
            </div>
        </div>
    </div>
);

// Parental Pattern Component
const ParentalPatternCard: React.FC<{ pattern: ParentalPatternV2 }> = ({ pattern }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className="w-full max-w-md p-4 rounded-2xl bg-teal-900/10 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-3">
                <Users2 className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider">Generational Pattern</h3>
            </div>
            <h4 className="text-sm font-bold text-white mb-2">{pattern.dynamicName}</h4>
            <div className="flex items-center gap-2 mb-3 text-xs">
                <div className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Parent: {pattern.parentTrait}</div>
                <div className="text-zinc-500">→</div>
                <div className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Partner: {pattern.partnerTrait}</div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-teal-500/30 pl-3">
                {pattern.insight}
            </p>
        </div>
    </div>
);

// Values Matrix Component
const ValuesMatrixCard: React.FC<{ matrix: ValuesMatrix }> = ({ matrix }) => (
    <div className="flex justify-start animate-fade-in w-full my-2">
        <div className="w-full max-w-md p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Values Alignment</h3>
            </div>

            <div className="flex items-end gap-2 mb-4">
                <div className="text-4xl font-bold text-white">{matrix.alignmentScore}%</div>
                <div className="text-xs text-zinc-500 mb-1.5">Alignment Score</div>
            </div>

            <div className="space-y-3">
                {/* Synergies */}
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase mb-1">Synergies (Where you click)</p>
                    <div className="flex flex-wrap gap-1">
                        {matrix.synergies.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[10px] border border-emerald-500/20">{s}</span>
                        ))}
                    </div>
                </div>

                {/* Conflicts */}
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase mb-1">Friction Points</p>
                    <div className="flex flex-wrap gap-1">
                        {matrix.conflicts.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded text-[10px] border border-rose-500/20">{s}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const TherapistChat: React.FC<TherapistChatProps> = ({ onBack, firebaseUid }) => {
    // Initial State loading from localStorage
    const [messages, setMessages] = useState<TherapistMessage[]>(() => {
        const saved = localStorage.getItem('therapist_messages');
        return saved ? JSON.parse(saved) : [];
    });
    const [clinicalNotes, setClinicalNotes] = useState<ClinicalNotes>(() => {
        const saved = localStorage.getItem('therapist_notes');
        return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    });

    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [interactionId, setInteractionId] = useState<string | undefined>(() => {
        return localStorage.getItem('therapist_interaction_id') || undefined;
    });
    const [streamingContent, setStreamingContent] = useState('');
    const [pendingImages, setPendingImages] = useState<string[]>([]);
    const [showNotesPanel, setShowNotesPanel] = useState(true);
    const [dashboardTab, setDashboardTab] = useState<'notes' | 'timeline'>('notes');
    const [editingNotes, setEditingNotes] = useState(false);
    const [customNotesInput, setCustomNotesInput] = useState(clinicalNotes.customNotes || '');
    const [pendingExercise, setPendingExercise] = useState<TherapistExercise | null>(null);

    // Persist State
    useEffect(() => {
        localStorage.setItem('therapist_messages', JSON.stringify(messages));
        localStorage.setItem('therapist_notes', JSON.stringify(clinicalNotes));
        if (interactionId) localStorage.setItem('therapist_interaction_id', interactionId);

        // Persist to DB if authenticated
        // Debounce this to avoid too many writes? Or just save on every update for now (safety first)
        if (firebaseUid && interactionId) {
            saveTherapistSession(firebaseUid, interactionId, messages, clinicalNotes)
                .catch(err => console.error('Failed to save session to DB:', err));
        }
    }, [messages, clinicalNotes, interactionId, firebaseUid]);

    // Load from DB on mount if we have an interaction ID but no messages/notes in memory (e.g. fresh load)
    // Actually, we should check DB first if interactionId exists in localStorage/prop to sync state
    useEffect(() => {
        const loadFromDb = async () => {
            if (interactionId) {
                try {
                    const session = await getTherapistSession(interactionId);
                    if (session) {
                        // Merge or overwrite? Overwrite is safer for "resume" logic
                        setMessages(session.messages);
                        setClinicalNotes(session.clinical_notes);
                    }
                } catch (e) {
                    console.error("Failed to load session from DB", e);
                }
            }
        };
        // Only load if we haven't already modified state? 
        // Or if we just mounted?
        // Simple logic: If we have an interaction ID, try to sync from DB on mount.
        if (interactionId) {
            loadFromDb();
        }
    }, []); // Run once on mount

    const [activeInsights, setActiveInsights] = useState<{
        perspective?: PerspectiveInsight;
        pattern?: PatternInsight;
        projection?: ProjectionInsight;
    }>({});

    const handleToolCall = (name: string, args: any) => {
        if (name === 'log_epiphany') {
            const epiphany: Epiphany = {
                id: Math.random().toString(36).substr(2, 9),
                content: args.content,
                category: args.category as any,
                timestamp: Date.now()
            };
            setClinicalNotes(prev => ({
                ...prev,
                epiphanies: [...(prev.epiphanies || []), epiphany]
            }));
        } else if (name === 'show_perspective_bridge') {
            setActiveInsights(prev => ({ ...prev, perspective: args }));
        } else if (name === 'show_communication_insight') {
            setActiveInsights(prev => ({ ...prev, pattern: args }));
        } else if (name === 'flag_projection') {
            setActiveInsights(prev => ({ ...prev, projection: args }));
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setPendingImages(prev => [...prev, base64]);
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setPendingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleNotesUpdate = (newNotes: Partial<ClinicalNotes>) => {
        setClinicalNotes(prev => ({
            ...prev,
            keyThemes: [...new Set([...(prev.keyThemes || []), ...(newNotes.keyThemes || [])])],
            userInsights: [...new Set([...(prev.userInsights || []), ...(newNotes.userInsights || [])])],
            actionItems: [...new Set([...(prev.actionItems || []), ...(newNotes.actionItems || [])])],
            attachmentStyle: newNotes.attachmentStyle || prev.attachmentStyle,
            emotionalState: newNotes.emotionalState || prev.emotionalState,
            relationshipDynamic: newNotes.relationshipDynamic || prev.relationshipDynamic,
        }));
    };

    const handleExerciseAssign = (exercise: { type: string; context: string }) => {
        setPendingExercise({
            type: exercise.type as ExerciseType,
            context: exercise.context,
            completed: false
        });
    };

    const handleSend = async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        // Include note about user edits if custom notes were added
        let messageToSend = trimmedInput;
        if (customNotesInput.trim() && customNotesInput !== clinicalNotes.customNotes) {
            setClinicalNotes(prev => ({ ...prev, customNotes: customNotesInput }));
        }

        const userMessage: TherapistMessage = {
            role: 'user',
            content: trimmedInput,
            timestamp: Date.now(),
            images: pendingImages.length > 0 ? [...pendingImages] : undefined
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        const imagesToSend = [...pendingImages];
        setPendingImages([]);
        setIsLoading(true);
        setStreamingContent('');

        try {
            let fullResponse = '';
            let currentInsights: any = {};

            const newInteractionId = await streamTherapistAdvice(
                messageToSend,
                interactionId,
                imagesToSend.length > 0 ? imagesToSend : undefined,
                clinicalNotes,
                (chunk) => {
                    fullResponse += chunk;
                    setStreamingContent(fullResponse);
                },
                handleNotesUpdate,
                handleExerciseAssign,
                (name, args) => {
                    if (name === 'log_epiphany') {
                        handleToolCall(name, args);
                    } else if (name.startsWith('generate_') || name.startsWith('trigger_') || name.startsWith('log_') || name.startsWith('assign_')) {
                        currentInsights[name] = args;
                    } else {
                        const key = name.replace('show_', '').replace('_insight', '').replace('flag_', '').replace('_bridge', '');
                        currentInsights[key] = args;
                    }
                }
            );

            const therapistMessage: TherapistMessage = {
                role: 'therapist',
                content: fullResponse,
                timestamp: Date.now(),
                ...currentInsights,
                // Explicit mapping for new tools to message properties if needed, 
                // but simpler to just dump currentInsights if keys match types
                closureScript: currentInsights['generate_closure_script'],
                safetyIntervention: currentInsights['trigger_safety_intervention'],
                parentalPattern: currentInsights['log_parental_pattern'],
                valuesMatrix: currentInsights['assign_values_matrix']
            };
            setMessages(prev => [...prev, therapistMessage]);
            setStreamingContent('');
            setInteractionId(newInteractionId || interactionId);
        } catch (error) {
            console.error('Therapist chat error:', error);
            const errorMessage: TherapistMessage = {
                role: 'therapist',
                content: "i'm having some trouble right now. let's try again in a moment?",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
            setStreamingContent('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getAttachmentStyleLabel = (style?: string) => {
        const labels: Record<string, string> = {
            'anxious': '😰 Anxious',
            'avoidant': '🚪 Avoidant',
            'secure': '💚 Secure',
            'fearful-avoidant': '😵‍💫 Fearful-Avoidant',
            'unknown': '❓ Assessing...'
        };
        return labels[style || 'unknown'] || style;
    };

    return (
        <div className="h-full w-full flex bg-gradient-to-b from-zinc-950 to-zinc-900 pb-16 md:pb-0">
            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${showNotesPanel ? 'md:w-2/3' : 'w-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center">
                                <HeartHandshake className="w-4 h-4 text-rose-400" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-white">Relationship Therapist</h1>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                                    {isLoading ? 'typing...' : 'here to listen'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNotesPanel(!showNotesPanel)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
                    >
                        {showNotesPanel ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                        <span className="hidden md:inline">Notes</span>
                        <span className="md:hidden">Insights</span>
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
                    {/* Welcome Message */}
                    {messages.length === 0 && !streamingContent && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
                            <div className="mb-4">
                                <Logo size={64} className="text-rose-400 opacity-60" />
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">hey, i'm here to help</h2>
                            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                                tell me what's going on. upload screenshots if you want me to analyze your conversations. i'll keep clinical notes on the side that you can edit.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                {['my partner is being distant', 'i keep attracting the same type', "i don't know if this is healthy"].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => setInputValue(prompt)}
                                        className="px-3 py-1.5 text-xs bg-zinc-800/50 border border-zinc-700 rounded-full text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? '' : ''}`}>
                                {/* Show images if any */}
                                {msg.images && msg.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 justify-end">
                                        {msg.images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={img}
                                                alt={`Uploaded ${i + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                                            />
                                        ))}
                                    </div>
                                )}
                                <div
                                    className={`px-4 py-3 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-rose-500/20 border border-rose-500/30 text-white rounded-br-sm'
                                        : 'bg-zinc-800/80 border border-zinc-700 text-zinc-200 rounded-bl-sm'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {/* Special Tool-Driven Insights */}
                                {msg.perspective && <PerspectiveCard insight={msg.perspective} />}
                                {msg.pattern && <PatternCard insight={msg.pattern} />}
                                {msg.projection && <ProjectionCard insight={msg.projection} />}
                                {msg.closureScript && <ClosureCard script={msg.closureScript} />}
                                {msg.safetyIntervention && <SafetyCard safety={msg.safetyIntervention} />}
                                {msg.parentalPattern && <ParentalPatternCard pattern={msg.parentalPattern} />}
                                {msg.valuesMatrix && <ValuesMatrixCard matrix={msg.valuesMatrix} />}
                            </div>
                        </div>
                    ))}

                    {/* Streaming Message */}
                    {streamingContent && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 rounded-bl-sm">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingContent}</p>
                                <span className="inline-block w-1.5 h-4 bg-rose-400 animate-pulse ml-0.5" />
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && !streamingContent && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="px-4 py-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 rounded-bl-sm">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                                    <span className="text-xs text-zinc-500">thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Exercise Card */}
                    {pendingExercise && !pendingExercise.completed && (
                        <ExerciseCard
                            exercise={pendingExercise}
                            onComplete={(result) => {
                                setPendingExercise({ ...pendingExercise, completed: true, result });
                                // Send exercise result back to AI
                                const resultMessage = `[EXERCISE COMPLETED: ${pendingExercise.type}]\nResults: ${JSON.stringify(result, null, 2)}`;
                                setInputValue(resultMessage);
                            }}
                            onSkip={() => setPendingExercise(null)}
                        />
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Pending Images Preview */}
                {pendingImages.length > 0 && (
                    <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase shrink-0">Attached:</span>
                            {pendingImages.map((img, idx) => (
                                <div key={idx} className="relative shrink-0">
                                    <img src={img} alt={`Preview ${idx}`} className="w-12 h-12 object-cover rounded-lg border border-zinc-700" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                    <div className="flex items-end gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 rounded-xl transition-colors"
                        >
                            <ImagePlus className="w-5 h-5 text-zinc-400" />
                        </button>
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="share what's on your mind..."
                            rows={1}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-rose-500/50 transition-colors scrollbar-hide"
                            style={{ maxHeight: '120px' }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isLoading}
                            className="p-3 bg-rose-500/20 hover:bg-rose-500/30 disabled:bg-zinc-800 disabled:opacity-50 border border-rose-500/30 disabled:border-zinc-700 rounded-xl transition-colors"
                        >
                            <Send className={`w-5 h-5 ${inputValue.trim() && !isLoading ? 'text-rose-400' : 'text-zinc-500'}`} />
                        </button>
                    </div>
                    <p className="text-[9px] text-zinc-600 text-center mt-2 font-mono">
                        this is AI guidance, not professional therapy
                    </p>
                </div>
            </div>

            {/* Clinical Notes Panel - Desktop (Side) & Mobile (Overlay) */}
            {
                showNotesPanel && (
                    <div className={`
                        fixed inset-0 z-50 md:relative md:inset-auto md:z-auto md:flex md:w-80 
                        border-l border-zinc-800 bg-zinc-950/95 md:bg-zinc-900/50 backdrop-blur-xl md:backdrop-blur-none
                        flex flex-col transition-all duration-300 ease-in-out
                        ${showNotesPanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 md:translate-x-0 md:opacity-100'}
                    `}>
                        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between md:justify-between">
                            <div className="flex md:hidden">
                                <button onClick={() => setShowNotesPanel(false)} className="p-2 -ml-2 text-zinc-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDashboardTab('notes')}
                                    className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${dashboardTab === 'notes' ? 'text-white' : 'text-zinc-500'}`}
                                >
                                    Notes
                                </button>
                                <button
                                    onClick={() => setDashboardTab('timeline')}
                                    className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${dashboardTab === 'timeline' ? 'text-white' : 'text-zinc-500'}`}
                                >
                                    Timeline
                                </button>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setEditingNotes(!editingNotes)}
                                    className={`p-1.5 rounded transition-colors ${editingNotes ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {dashboardTab === 'notes' ? (
                                <>
                                    {/* Attachment Style */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Attachment Style</div>
                                        <div className="text-sm text-white font-medium">
                                            {getAttachmentStyleLabel(clinicalNotes.attachmentStyle)}
                                        </div>
                                    </div>

                                    {/* Emotional State */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Emotional State</div>
                                        <div className="text-sm text-white">
                                            {clinicalNotes.emotionalState || 'Not yet assessed'}
                                        </div>
                                    </div>

                                    {/* Key Themes */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Key Themes</div>
                                        {clinicalNotes.keyThemes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {clinicalNotes.keyThemes.map((theme, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs rounded-full">
                                                        {theme}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-zinc-500">Themes will appear as we talk</p>
                                        )}
                                    </div>

                                    {/* User Insights */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Your Insights</div>
                                        {clinicalNotes.userInsights.length > 0 ? (
                                            <ul className="space-y-1">
                                                {clinicalNotes.userInsights.map((insight, i) => (
                                                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1">
                                                        <span className="text-rose-400">•</span>
                                                        {insight}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-zinc-500">Realizations will be captured here</p>
                                        )}
                                    </div>

                                    {/* Action Items */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Action Items</div>
                                        {clinicalNotes.actionItems.length > 0 ? (
                                            <ul className="space-y-1">
                                                {clinicalNotes.actionItems.map((item, i) => (
                                                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1">
                                                        <span className="text-emerald-400">→</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-zinc-500">Suggestions will appear here</p>
                                        )}
                                    </div>

                                    {/* Custom Notes */}
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Your Notes</div>
                                        {editingNotes ? (
                                            <textarea
                                                value={customNotesInput}
                                                onChange={(e) => setCustomNotesInput(e.target.value)}
                                                placeholder="Add your own observations..."
                                                rows={3}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-rose-500/50"
                                            />
                                        ) : (
                                            <p className="text-xs text-zinc-400">
                                                {clinicalNotes.customNotes || 'Click edit to add your own notes'}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Timeline View */
                                <div className="space-y-6 relative ml-2 mt-4">
                                    <div className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-800" />
                                    {clinicalNotes.epiphanies && clinicalNotes.epiphanies.length > 0 ? (
                                        clinicalNotes.epiphanies.map((epi, i) => (
                                            <div key={epi.id} className="relative pl-6 animate-fade-in">
                                                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-rose-500 z-10" />
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-zinc-500 font-mono">
                                                            {new Date(epi.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-tighter ${epi.category === 'growth' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            epi.category === 'self' ? 'bg-blue-500/10 text-blue-400' :
                                                                epi.category === 'partner' ? 'bg-indigo-500/10 text-indigo-400' :
                                                                    'bg-purple-500/10 text-purple-400'
                                                            }`}>
                                                            {epi.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-white bg-zinc-800/30 p-2 rounded-lg border border-zinc-800/50">
                                                        {epi.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <History className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                                            <p className="text-xs text-zinc-500 italic">No major realizations logged yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};
