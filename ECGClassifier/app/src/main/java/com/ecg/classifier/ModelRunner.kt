package com.ecg.classifier

import android.content.Context
import org.pytorch.IValue
import org.pytorch.Module
import org.pytorch.Tensor
import java.io.File
import java.io.FileOutputStream
import kotlin.math.exp

/**
 * ModelRunner — loads a TorchScript CAWT model from assets and runs inference.
 *
 * Input : FloatArray of size 187 (one ECG beat, values in [0, 1])
 * Output: InferenceResult with softmax probabilities for each of 5 classes
 */
class ModelRunner(context: Context, modelFileName: String) {

    companion object {
        const val INPUT_LENGTH = 187
        const val NUM_CLASSES  = 5

        // Available models (filename → display name)
        val MODEL_OPTIONS = listOf(
            ModelOption("cawt_v1_mobile.pt", "CAWT v1", "F1: 94.05%"),
            ModelOption("cawt_v2_mobile.pt", "CAWT v2", "F1: 92.51%")
        )

        val CLASS_NAMES = listOf(
            "Normal (N)",
            "Supraventricular (S)",
            "Ventricular (V)",
            "Fusion (F)",
            "Unknown (Q)"
        )

        val CLASS_DESCRIPTIONS = listOf(
            "Normal sinus rhythm — no abnormality detected.",
            "Supraventricular ectopic beat — originates above the ventricles.",
            "Ventricular ectopic beat — originates in the ventricles. Monitor closely.",
            "Fusion beat — combination of Normal + Ventricular beat.",
            "Unclassifiable beat — may require further analysis."
        )
    }

    val modelName: String
    private val module: Module

    init {
        val opt = MODEL_OPTIONS.find { it.fileName == modelFileName } ?: MODEL_OPTIONS[0]
        modelName = opt.displayName
        val modelFile = assetFilePath(context, opt.fileName)
        module = Module.load(modelFile)
    }

    /**
     * Run inference on a single ECG beat.
     * @param rawSignal FloatArray(187) — will be normalized to [0,1] automatically.
     */
    fun classify(rawSignal: FloatArray): InferenceResult {
        require(rawSignal.size == INPUT_LENGTH) {
            "Expected $INPUT_LENGTH values, got ${rawSignal.size}"
        }

        val signal = normalize(rawSignal)

        // shape [1, 1, 187]: batch=1, channels=1, length=187
        val inputTensor = Tensor.fromBlob(signal, longArrayOf(1L, 1L, INPUT_LENGTH.toLong()))

        val outputTensor = module.forward(IValue.from(inputTensor)).toTensor()
        val logits = outputTensor.dataAsFloatArray

        val probs = softmax(logits)
        val predictedClass = probs.indices.maxByOrNull { probs[it] } ?: 0

        return InferenceResult(
            probabilities  = probs,
            predictedClass = predictedClass,
            className      = CLASS_NAMES[predictedClass],
            description    = CLASS_DESCRIPTIONS[predictedClass],
            confidence     = probs[predictedClass]
        )
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun normalize(signal: FloatArray): FloatArray {
        var min = Float.MAX_VALUE
        var max = Float.MIN_VALUE
        for (v in signal) {
            if (v < min) min = v
            if (v > max) max = v
        }
        val range = max - min
        return if (range < 1e-8f) {
            FloatArray(signal.size) { 0f }
        } else {
            FloatArray(signal.size) { i -> (signal[i] - min) / range }
        }
    }

    private fun softmax(logits: FloatArray): FloatArray {
        var maxVal = Float.NEGATIVE_INFINITY
        for (v in logits) if (v > maxVal) maxVal = v

        val expVals = FloatArray(logits.size) { i -> exp((logits[i] - maxVal).toDouble()).toFloat() }
        var sum = 0f
        for (v in expVals) sum += v

        return FloatArray(expVals.size) { i -> expVals[i] / sum }
    }

    private fun assetFilePath(context: Context, assetName: String): String {
        val file = File(context.filesDir, assetName)
        if (file.exists() && file.length() > 0) return file.absolutePath
        context.assets.open(assetName).use { input ->
            FileOutputStream(file).use { output ->
                val buf = ByteArray(4 * 1024)
                var read: Int
                while (input.read(buf).also { read = it } != -1) {
                    output.write(buf, 0, read)
                }
                output.flush()
            }
        }
        return file.absolutePath
    }
}

data class ModelOption(
    val fileName: String,
    val displayName: String,
    val info: String
) {
    override fun toString(): String = "$displayName ($info)"
}

data class InferenceResult(
    val probabilities:  FloatArray,
    val predictedClass: Int,
    val className:      String,
    val description:    String,
    val confidence:     Float
)
