import './App.css'
import { useState } from "react";
import { motion } from 'framer-motion'

const buttonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
};

function App() {
    const [canStart, setCanStart] = useState<boolean>(true);
    const [record, setRecord] = useState<MediaRecorder | null>(null);
    let chunk: Blob[] = [];

    async function setUpVideoFeedback(stream: MediaStream) {
        const video = document.querySelector('.video-feedback') as HTMLVideoElement;
        if (video) {
            video.srcObject = stream;
            await video.play();
        } else {
            console.error('Video element not found');
        }
    }

    async function setupStream(): Promise<{ stream: MediaStream | undefined; audio: MediaStream | undefined }> {
        try {
            const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const audio: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            await setUpVideoFeedback(stream);
            return { stream, audio };
        } catch (err) {
            console.error('Error accessing media devices:', err);
            return { stream: undefined, audio: undefined };
        }
    }

    async function startRecording() {
        const { stream, audio } = await setupStream();

        if (stream && audio) {
            const mixedStream: MediaStream = new MediaStream([...stream.getTracks(), ...audio.getTracks()]);
            const dRecord = new MediaRecorder(mixedStream);
            setRecord(dRecord);

            dRecord.ondataavailable = (e: BlobEvent) => {
                chunk.push(e.data);
            };

            dRecord.onstop = () => {
                setCanStart(true);
                const blob: Blob = new Blob(chunk, { type: 'video/mp4' });
                chunk = [];

                const downloadButton = document.querySelector('.download-video') as HTMLAnchorElement;
                if (downloadButton) {
                    downloadButton.href = URL.createObjectURL(blob);
                    downloadButton.download = 'video.mp4';
                }

                const recordedVideo = document.querySelector('.recorded-video') as HTMLVideoElement;
                if (recordedVideo) {
                    recordedVideo.src = URL.createObjectURL(blob);
                    recordedVideo.load();
                    recordedVideo.onloadeddata = async function () {
                        const rc = document.querySelector(".recorded-video-wrap") as HTMLDivElement;
                        if (rc) {
                            rc.classList.remove("hidden");
                            rc.scrollIntoView({ behavior: "smooth", block: "start" });
                            await recordedVideo.play();
                        }
                    };
                }

                // Stop and release the video stream
                stream.getTracks().forEach((track) => track.stop());
                audio.getTracks().forEach((track) => track.stop());
            };

            dRecord.start(500);
            setCanStart(false);
        } else {
            console.error('Recorder is not available');
        }
    }

    function stopRecording() {
        if (record) {
            record.stop();
        } else {
            console.error('Recorder is null even after starting recording');
        }
    }

    const startButt: string = !canStart ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-900 text-gray-300';
    const stopButt: string = canStart ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-900 text-gray-300';

    return (
        <section>
            <main className="overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 min-h-screen">
                <div className="container mx-auto py-12 px-6">
                    <h2 className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 uppercase font-extrabold mb-6 flex items-center justify-center">
                        Video Recorder
                        {!canStart && <span className="blink ml-2 text-red-500">📹</span>}
                    </h2>

                    <div className="flex justify-between items-center h-[75vh] mx-6 bg-gradient-to-br from-gray-100 to-gray-300 shadow-lg rounded-lg p-6">
                        <div className="w-4/12 flex flex-col items-center">
                            <motion.button
                                onClick={startRecording}
                                disabled={!canStart}
                                className={`bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-full font-semibold mb-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${startButt}`}
                                variants={buttonVariants}
                            >
                                Start Recording
                            </motion.button>
                            <motion.button
                                onClick={stopRecording}
                                disabled={canStart}
                                className={`bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${stopButt}`}
                                variants={buttonVariants}
                            >
                                Stop Recording
                            </motion.button>
                        </div>

                        <div className="video-feedback-container h-full w-8/12 rounded-lg shadow-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a1a, #333)' }}>
                            <video
                                src=""
                                className="video-feedback bg-transparent h-full w-full rounded-lg"
                                autoPlay
                            ></video>
                            <div className="video-placeholder absolute text-white text-lg">
                                {canStart ? "Click 'Start Recording' to begin" : ""}
                            </div>
                        </div>
                    </div>

                    <div className="recorded-video-wrap mt-20 hidden bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl">
                        <h2 className="text-2xl text-white uppercase font-bold mb-6 text-center">
                            Recorded Video
                        </h2>
                        <div className="flex justify-center items-center">
                            <video
                                src=""
                                className="recorded-video bg-black h-[30rem] rounded-lg shadow-lg"
                                controls
                            ></video>
                            <div className="flex justify-center items-center ml-8">
                                <a
                                    className="download-video text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 rounded-md uppercase font-bold transition-all duration-300 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                >
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </section>
    );
}

export default App;
