import Config from '../Config';
import Utils from '../utils/Utils';

class GAN {

    constructor() {
        this.runner = null;
        this.currentNoise = null;
        this.input = null;
    }

    static async getWeightFilePrefix() {
        var country = await Utils.getCountry();

        var servers = Config.modelConfig[Config.currentModel].gan.modelServers.filter(server => server.country === country);
        if (servers.length === 0) {
            servers = Config.modelConfig[Config.currentModel].gan.modelServers.filter(server => !server.country);
        }

        var index = Math.floor(Math.random() * servers.length);
        var modelPath = Config.modelCompression? Config.modelConfig[Config.currentModel].gan.model + '_8bit' : Config.modelConfig[Config.currentModel].gan.model;
        return 'http://' + (servers[index].host || servers[index]) + modelPath;
    }

    async init(onInitProgress) {
        var modelPath = Config.modelCompression? Config.modelConfig[Config.currentModel].gan.model + '_8bit' : Config.modelConfig[Config.currentModel].gan.model;
        this.runner = await window.WebDNN.load(modelPath, {progressCallback: onInitProgress, weightDirectory: await GAN.getWeightFilePrefix()});
    }

    async run(label, noise) {
        this.currentNoise = noise || Array.apply(null, {length: Config.modelConfig[Config.currentModel].gan.noiseLength}).map(() => Utils.randomNormal());
        let input = this.currentNoise.concat(label);
        this.currentInput = input;
        this.runner.getInputViews()[0].set(input);
        await this.runner.run();
        let output = this.runner.getOutputViews()[0].toActual();
        output = output.map(x => !isNaN(x) ? x : 1); // XXX: Output generated by WebGPU on NVIDIA GPU may contain NaN
        return output;
    }

    getCurrentNoise() {
        return this.currentNoise;
    }

    getCurrentInput() {
        return this.currentInput;
    }
}

export default GAN;