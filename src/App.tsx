import './App.css'
import {useState} from "react";
import {motion} from 'framer-motion'

const buttonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
};
function App() {
    console.log("Mount");
    const [canStart, setCanStart] = useState<boolean>(true);
    const [record, setRecord] = useState<MediaRecorder | null>(null);
    let chunk: Blob[] = [];

    async function setUpVideoFeedback(stream: MediaStream) {
        if (stream) {
            const video = document.querySelector('.video-feedback') as HTMLVideoElement;
            video.srcObject = stream;
            await video.play();
        } else {
            console.log('No stream Available1')
        }
    }

    async function setupStream(): Promise<{ stream: MediaStream | undefined; audio: MediaStream | undefined }> {
        try {
            const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({video: true});
            const audio: MediaStream = await navigator.mediaDevices.getUserMedia({audio: true});
            await setUpVideoFeedback(stream);
            return {stream, audio}
        } catch (err) {
            console.log(err)
            return {stream: undefined, audio: undefined};
        }
    }

    async function startRecording() {
        const {stream, audio} = await setupStream();

        if (stream && audio) {
            const mixedStream: MediaStream = new MediaStream([...stream.getTracks(), ...audio.getTracks()])
            const dRecord = new MediaRecorder(mixedStream);
            setRecord(dRecord);
            if (dRecord) {
                dRecord.ondataavailable = (e: BlobEvent) => {
                    console.log(e.data);
                    chunk.push(e.data);
                };
                dRecord.onstop = () => {
                    console.log('handleStop starting');
                    setCanStart(true);

                    const blob: Blob = new Blob(chunk, {type: 'video/mp4'});
                    chunk = [];

                    const downloadButton = document.querySelector('.download-video') as HTMLAnchorElement;
                    if (downloadButton) {
                        downloadButton.href = URL.createObjectURL(blob);
                        downloadButton.download = 'video.mp4';
                    }

                    const recordedVideo = document.querySelector('.recorded-video') as HTMLVideoElement;
                    recordedVideo.src = URL.createObjectURL(blob);
                    recordedVideo.load();
                    recordedVideo.onloadeddata = async function () {
                        const rc = document.querySelector(".recorded-video-wrap") as HTMLDivElement;
                        rc.classList.remove("hidden");
                        rc.scrollIntoView({behavior: "smooth", block: "start"});
                        await recordedVideo.play();
                    };

                    // Stop and release the video stream
                    stream.getTracks().forEach((track) => track.stop());
                    audio.getTracks().forEach((track) => track.stop());
                    console.log('HandleStop last');
                }
            }
            dRecord.start(500);

            setCanStart(false);
            console.log('Recording started');
        } else {
            console.log('recorder is not available');
        }
    }

    function stopRecording() {
        console.log('from here');
        if (record) {
            record.stop();
            console.log('recording stopped');
        } else {
            console.log('recorder is null even after starting recording');
        }
    }

    const startButt: string = !canStart ? 'text-gray-600' : 'hover:bg-slate-900 text-gray-300'
    const stopButt: string = canStart ? 'text-gray-600' : 'hover:bg-slate-900 text-gray-300'

    return (
        <section>
            <main className="overflow-hidden">
                <div className="container mx-auto py-8 px-4">
                    <h2 className="text-xl text-gray-500 uppercase font-light mb-4 flex op items-center ">
                        Video recorder
                        {!canStart && <span className={'blink mb-1'}>🎥</span>}
                    </h2>

                    <div className={'flex op justify-between h-[85vh] mx-9'}>
                        <div className="op w-4/12 flex justify-center ">
                            <div className={'op mt-20'}>
                                <motion.button onClick={startRecording} disabled={!canStart}
                                               className={`bg-slate-950 p-3 rounded-lg font-bold mb-6 mr-4 ${startButt}`}
                                               variants={buttonVariants}
                                >
                                    Start Recording
                                </motion.button>
                                <motion.button onClick={stopRecording} disabled={canStart}
                                               className={`bg-slate-950 p-3 rounded-lg font-bold ${stopButt}`}
                                               variants={buttonVariants}
                                >
                                    Stop Recording
                                </motion.button>
                            </div>
                        </div>

                        <video src="" className="op video-feedback bg-black h-full w-8/12 rounded-2xl" autoPlay></video>
                    </div>

                    <div className="recorded-video-wrap mt-20 hidden">
                        <h2 className="text-xl text-gray-500 uppercase font-light op">
                            Recorded video
                        </h2>
                        <div className={'flex'}>
                            <video src="" className="recorded-video bg-black h-full w-10/12 rounded-2xl" controls></video>
                            <div className="op flex justify-center items-center ml-10">
                                <a className="rounded-lg op download-video text-center flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 uppercase text-lg font-bold transition-all duration-300 hover:opacity-90 disabled:opacity-50 hover:cursor-pointer">
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </section>
    )
}

export default App;
