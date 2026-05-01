package com.ecg.classifier

import android.Manifest
import android.animation.ValueAnimator
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*

class MainActivity : AppCompatActivity() {

    private lateinit var classRing: ClassificationRingView
    private lateinit var manualInputLayout: LinearLayout
    private lateinit var demoLayout: LinearLayout
    private lateinit var etManualInput: EditText
    private lateinit var btnClassify: TextView
    private lateinit var tvCsvStatus: TextView
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var tvLoadingMsg: TextView
    private lateinit var resultCard: LinearLayout
    private lateinit var probabilitiesSection: LinearLayout
    private lateinit var tvPredictedClass: TextView
    private lateinit var tvConfidence: TextView
    private lateinit var tvDescription: TextView
    private lateinit var tvModelUsed: TextView
    private lateinit var tvInputCount: TextView
    private lateinit var barsContainer: LinearLayout
    private lateinit var btnClear: TextView
    private lateinit var spinnerModel: Spinner
    private lateinit var tvSubtitle: TextView
    private lateinit var ecgWaveform: EcgWaveformView
    private lateinit var tvWaveformStatus: TextView
    private lateinit var btnTabManual: TextView
    private lateinit var btnTabImport: TextView
    private lateinit var btnTabDemo: TextView

    private var modelRunner: ModelRunner? = null
    private var importedSignal: FloatArray? = null
    private var currentModelFile: String = ModelRunner.MODEL_OPTIONS[0].fileName
    private var currentTab = 0
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val CLASS_COLORS = listOf("#34C759", "#007AFF", "#FF3B30", "#FF9500", "#8E8E93")

    companion object {
        private const val REQ_CSV = 1001
        private const val REQ_PERM = 1002
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        bindViews()
        setupModelSelector()
        setupTabButtons()
        setupBottomBar()
        setupListeners()
        loadModel(currentModelFile)
    }

    private fun bindViews() {
        classRing          = findViewById(R.id.classRing)
        manualInputLayout  = findViewById(R.id.manualInputLayout)
        demoLayout         = findViewById(R.id.demoLayout)
        etManualInput      = findViewById(R.id.etManualInput)
        btnClassify        = findViewById(R.id.btnClassify)
        tvCsvStatus        = findViewById(R.id.tvCsvStatus)
        loadingOverlay     = findViewById(R.id.loadingOverlay)
        tvLoadingMsg       = findViewById(R.id.tvLoadingMsg)
        resultCard         = findViewById(R.id.resultCard)
        probabilitiesSection = findViewById(R.id.probabilitiesSection)
        tvPredictedClass   = findViewById(R.id.tvPredictedClass)
        tvConfidence       = findViewById(R.id.tvConfidence)
        tvDescription      = findViewById(R.id.tvDescription)
        tvModelUsed        = findViewById(R.id.tvModelUsed)
        tvInputCount       = findViewById(R.id.tvInputCount)
        barsContainer      = findViewById(R.id.barsContainer)
        btnClear           = findViewById(R.id.btnClear)
        spinnerModel       = findViewById(R.id.spinnerModel)
        tvSubtitle         = findViewById(R.id.tvSubtitle)
        ecgWaveform        = findViewById(R.id.ecgWaveform)
        tvWaveformStatus   = findViewById(R.id.tvWaveformStatus)
        btnTabManual       = findViewById(R.id.btnTabManual)
        btnTabImport       = findViewById(R.id.btnTabImport)
        btnTabDemo         = findViewById(R.id.btnTabDemo)
    }

    private fun setupModelSelector() {
        val adapter = ArrayAdapter(this, R.layout.spinner_selected_item,
            ModelRunner.MODEL_OPTIONS.map { it.toString() })
        adapter.setDropDownViewResource(R.layout.spinner_dropdown_item)
        spinnerModel.adapter = adapter
        spinnerModel.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, pos: Int, id: Long) {
                val opt = ModelRunner.MODEL_OPTIONS[pos]
                if (opt.fileName != currentModelFile) { currentModelFile = opt.fileName; loadModel(currentModelFile) }
            }
            override fun onNothingSelected(p: AdapterView<*>?) {}
        }
    }

    private fun setupTabButtons() {
        btnTabManual.setOnClickListener { switchTab(0) }
        btnTabImport.setOnClickListener { pickCsvFile() }
        btnTabDemo.setOnClickListener { switchTab(2) }
    }

    private fun switchTab(tab: Int) {
        currentTab = tab
        listOf(btnTabManual, btnTabImport, btnTabDemo).forEach {
            it.setBackgroundResource(R.drawable.bg_button_secondary)
            it.setTextColor(getColor(R.color.text_secondary))
        }
        val active = when (tab) { 0 -> btnTabManual; 1 -> btnTabImport; else -> btnTabDemo }
        active.setBackgroundResource(R.drawable.bg_button_accent)
        active.setTextColor(getColor(R.color.white))

        manualInputLayout.visibility = if (tab == 0) View.VISIBLE else View.GONE
        demoLayout.visibility        = if (tab == 2) View.VISIBLE else View.GONE
        btnClassify.visibility       = if (tab < 2) View.VISIBLE else View.GONE
        tvCsvStatus.visibility       = if (tab == 1 && importedSignal != null) View.VISIBLE else View.GONE
    }

    // 3 circle buttons: Classify, +Add File, About
    private fun setupBottomBar() {
        findViewById<TextView>(R.id.navClassify).setOnClickListener { classify() }
        findViewById<TextView>(R.id.navAddFile).setOnClickListener { pickCsvFile() }
        findViewById<TextView>(R.id.navAbout).setOnClickListener {
            startActivity(Intent(this, AboutActivity::class.java))
        }
    }

    private fun setupListeners() {
        etManualInput.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                val vals = s.toString().trim().split(Regex("[,\\s]+")).filter { it.toFloatOrNull() != null }
                tvInputCount.text = "${vals.size} / 187 values"
                tvInputCount.setTextColor(if (vals.size == 187) getColor(R.color.green) else getColor(R.color.text_secondary))
                if (vals.size >= 10) {
                    ecgWaveform.setSignal(vals.take(187).map { it.toFloat() }.toFloatArray())
                    tvWaveformStatus.text = "${vals.size} points loaded"
                }
            }
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
        })

        btnClassify.setOnClickListener { classify() }
        btnClear.setOnClickListener { clearAll() }

        // Demo beats
        DemoBeats.ALL.forEach { demo ->
            val btn = TextView(this).apply {
                text = demo.name
                setBackgroundResource(R.drawable.bg_button_secondary)
                setTextColor(getColor(R.color.text_primary))
                textSize = 14f
                gravity = android.view.Gravity.CENTER
                setPadding(32, 28, 32, 28)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = 10 }
            }
            btn.setOnClickListener {
                ecgWaveform.setSignal(demo.signal)
                tvWaveformStatus.text = "Demo: ${demo.letter}"
                classifySignal(demo.signal)
            }
            demoLayout.addView(btn)
        }
    }

    private fun clearAll() {
        etManualInput.text.clear(); importedSignal = null
        tvCsvStatus.visibility = View.GONE
        resultCard.visibility = View.GONE; probabilitiesSection.visibility = View.GONE
        classRing.clear(); ecgWaveform.clearSignal()
        tvWaveformStatus.text = "Load a signal to preview"
        // Reset import button text
        btnTabImport.text = "Import"
    }

    private fun loadModel(file: String) {
        val opt = ModelRunner.MODEL_OPTIONS.find { it.fileName == file } ?: ModelRunner.MODEL_OPTIONS[0]
        showLoading("Loading ${opt.displayName}")
        btnClassify.isEnabled = false
        scope.launch {
            runCatching { withContext(Dispatchers.IO) { ModelRunner(this@MainActivity, file) } }
                .onSuccess {
                    modelRunner = it; hideLoading(); btnClassify.isEnabled = true
                    tvSubtitle.text = "${opt.displayName} · ${opt.info}"
                    Toast.makeText(this@MainActivity, "${opt.displayName} loaded", Toast.LENGTH_SHORT).show()
                }
                .onFailure { hideLoading(); showError("Failed: ${it.message}") }
        }
    }

    private fun classify() {
        modelRunner ?: run { Toast.makeText(this, "Model not loaded", Toast.LENGTH_SHORT).show(); return }
        val signal: FloatArray = when (currentTab) {
            0 -> when (val r = CsvParser.parseText(etManualInput.text.toString())) {
                is CsvParser.ParseResult.Success -> r.signal
                is CsvParser.ParseResult.Error -> { showError(r.message); null }
            }
            1 -> importedSignal ?: run { showError("Import a file first"); null }
            else -> null
        } ?: return
        ecgWaveform.setSignal(signal); tvWaveformStatus.text = "187 points"
        classifySignal(signal)
    }

    private fun classifySignal(signal: FloatArray) {
        val runner = modelRunner ?: return
        showLoading("Analyzing"); btnClassify.isEnabled = false
        scope.launch {
            runCatching { withContext(Dispatchers.Default) { runner.classify(signal) } }
                .onSuccess { hideLoading(); btnClassify.isEnabled = true; showResult(it, runner.modelName) }
                .onFailure { hideLoading(); btnClassify.isEnabled = true; showError("Failed: ${it.message}") }
        }
    }

    private fun showResult(result: InferenceResult, modelName: String) {
        triggerHaptic()
        val letters = listOf("N", "S", "V", "F", "Q")
        val color = android.graphics.Color.parseColor(CLASS_COLORS[result.predictedClass])

        // Ring
        classRing.setResult(result.probabilities, letters[result.predictedClass], result.className)

        // Highlight peak in waveform
        ecgWaveform.highlightPeak(color)

        // Pink result card
        resultCard.visibility = View.VISIBLE
        resultCard.alpha = 0f; resultCard.translationY = 40f
        resultCard.animate().alpha(1f).translationY(0f).setDuration(400)
            .setInterpolator(DecelerateInterpolator()).start()
        tvDescription.text = result.description
        tvConfidence.text = "${(result.confidence * 100).toInt()}%"
        tvModelUsed.text = modelName

        tvPredictedClass.text = result.className
        tvPredictedClass.setTextColor(color)

        // Probabilities
        probabilitiesSection.visibility = View.VISIBLE
        barsContainer.removeAllViews()
        result.probabilities.forEachIndexed { i, prob ->
            val row = layoutInflater.inflate(R.layout.item_class_bar, barsContainer, false)
            val tvName = row.findViewById<TextView>(R.id.tvClassName)
            val tvPct = row.findViewById<TextView>(R.id.tvPercent)
            val bar = row.findViewById<ProgressBar>(R.id.progressBar)
            tvName.text = ModelRunner.CLASS_NAMES[i]
            tvPct.text = "${(prob * 100).toInt()}%"
            bar.max = 100; bar.progress = 0
            bar.progressTintList = android.content.res.ColorStateList.valueOf(
                android.graphics.Color.parseColor(CLASS_COLORS[i]))
            if (i == result.predictedClass) {
                row.setBackgroundResource(R.drawable.bg_highlight_bar)
                tvName.setTextColor(android.graphics.Color.parseColor(CLASS_COLORS[i]))
                tvName.setTypeface(tvName.typeface, android.graphics.Typeface.BOLD)
                tvPct.setTextColor(android.graphics.Color.parseColor(CLASS_COLORS[i]))
            }
            ValueAnimator.ofInt(0, (prob * 100).toInt()).apply {
                duration = 700; startDelay = (i * 100).toLong()
                interpolator = DecelerateInterpolator(1.5f)
                addUpdateListener { bar.progress = it.animatedValue as Int }
                start()
            }
            barsContainer.addView(row)
        }
    }

    private fun triggerHaptic() {
        try {
            val vib = getSystemService(Vibrator::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                vib?.vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
        } catch (_: Exception) {}
    }

    private fun pickCsvFile() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), REQ_PERM); return
        }
        startActivityForResult(Intent.createChooser(
            Intent(Intent.ACTION_GET_CONTENT).apply { type = "*/*"; addCategory(Intent.CATEGORY_OPENABLE) },
            "Select ECG File"), REQ_CSV)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_CSV && resultCode == Activity.RESULT_OK)
            data?.data?.let { processCsvUri(it) }
    }

    private fun processCsvUri(uri: Uri) {
        scope.launch {
            showLoading("Parsing")
            when (val r = withContext(Dispatchers.IO) { CsvParser.parse(this@MainActivity, uri) }) {
                is CsvParser.ParseResult.Success -> {
                    hideLoading(); importedSignal = r.signal
                    // Update tab to show loaded state
                    currentTab = 1
                    btnTabImport.text = "Loaded ✓"
                    btnTabImport.setBackgroundResource(R.drawable.bg_button_accent)
                    btnTabImport.setTextColor(getColor(R.color.white))
                    tvCsvStatus.text = "187 values loaded"
                    tvCsvStatus.setTextColor(getColor(R.color.green))
                    tvCsvStatus.visibility = View.VISIBLE
                    ecgWaveform.setSignal(r.signal); tvWaveformStatus.text = "187 points from file"
                    manualInputLayout.visibility = View.GONE
                    demoLayout.visibility = View.GONE
                    btnClassify.visibility = View.VISIBLE
                }
                is CsvParser.ParseResult.Error -> {
                    hideLoading(); importedSignal = null
                    Toast.makeText(this@MainActivity, r.message, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun showLoading(msg: String) { tvLoadingMsg.text = msg; loadingOverlay.visibility = View.VISIBLE }
    private fun hideLoading() { loadingOverlay.visibility = View.GONE }
    private fun showError(msg: String) { Toast.makeText(this, msg, Toast.LENGTH_LONG).show() }
    override fun onDestroy() { super.onDestroy(); scope.cancel() }
}
