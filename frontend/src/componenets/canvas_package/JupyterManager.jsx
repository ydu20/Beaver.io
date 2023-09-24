import {
    KernelManager,
    KernelConnection,
    Session,
    SessionAPI,
    KernelMessage,
    KernelAPI,
    SessionManager,
    ServerConnection,
} from '@jupyterlab/services';

export default class JupyterManager {
    
    baseUrl = 'http://localhost:8080';
    wsUrl = 'ws://localhost:8080';
    token = 'dd578518f41dfde64d4ff07389e93d4b4d53af9f59c86baf';

    constructor(window) {
        this.window = window;
        this.serverSettings = ServerConnection.makeSettings({
            baseUrl: this.baseUrl,
            wsUrl: this.wsUrl,
            token: this.token,
        });
        this.kernelManager = new KernelManager({
            serverSettings: this.serverSettings,
        });
        this.kernelConnection = null;

        // Attaching react handlers
        this.window.startJupyterEnv = this.startEnv;
    }

    // ********************Starting a jupyter environment***********************
    startEnv = () => {
        return new Promise((resolve, reject) => {
            if (!this.kernelConnection) {
                console.log("STARTING KERNEL CONNECTION......");
    
                this.kernelManager.startNew().then(kc => {
                    console.log("Kernel connection started!!!");
                    console.log(kc);
    
                    this.kernelConnection = kc;

                    // Update control bar
                    if (this.window.setControlBarStatus) {
                        this.window.setControlBarStatus(true);
                    }

                    resolve(kc);
                }).catch(err => {
                    reject(err);
                })
            } else {
                resolve(this.kernelConnection);
            }
        })
    }

    // ********************Running a cell***********************
    async runCell(code) {
        try {

            // Start kernel connection if neccessary
            if (!this.kernelConnection) {
                await this.startEnv();
            }
            
            // Handle no code
            if (code === null || code.trim() === '') {
                return {
                    exeCount: 0,
                    output: ''
                };
            }

            let outputs = '';
            let future = this.kernelConnection.requestExecute({code: code});

            future.onIOPub = msg => {
                if (msg.header.msg_type === 'stream') {
                    console.log("1");
                    console.log(msg);
                    console.log(outputs);
                    outputs = outputs + msg.content?.text;
                    console.log(outputs);
                }
                if (msg.header.msg_type === 'execute_result') {
                    console.log("1")
                    console.log(msg);

                    outputs = outputs + msg.content.data['text/plain'];
                }
            }

            let reply = await future.done;

            console.log("2");
            console.log(outputs);

            

            if (reply.content.status === 'error') {
                outputs = outputs + `${reply.content.ename}: ${reply.content.evalue}`;
                console.log(reply.content.execution_count);
            }
            
            return {
                exeCount: reply.content.execution_count,
                output: outputs
            };


        } catch (error) {
            throw error;
        }
    }

}