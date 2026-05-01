package com.ecg.classifier

import android.os.Bundle
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class AboutActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_about)

        // Close button
        findViewById<TextView>(R.id.btnAboutClose).setOnClickListener { finish() }

        // Populate model stats
        val statsContainer = findViewById<LinearLayout>(R.id.modelStatsContainer)
        val stats = listOf(
            Triple("CAWT v1", "F1: 94.05%", 94),
            Triple("CAWT v2", "F1: 92.51%", 92)
        )
        stats.forEach { (name, detail, pct) ->
            val row = layoutInflater.inflate(R.layout.item_class_bar, statsContainer, false)
            row.findViewById<TextView>(R.id.tvClassName).text = name
            row.findViewById<TextView>(R.id.tvPercent).text = detail
            val bar = row.findViewById<ProgressBar>(R.id.progressBar)
            bar.max = 100
            bar.progress = pct
            bar.progressTintList = android.content.res.ColorStateList.valueOf(
                android.graphics.Color.parseColor("#E8602C")
            )
            statsContainer.addView(row)
        }
    }
}
