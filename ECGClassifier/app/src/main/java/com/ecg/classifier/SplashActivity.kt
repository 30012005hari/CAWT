package com.ecg.classifier

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val tvTitle = findViewById<TextView>(R.id.tvSplashTitle)
        val tvSub = findViewById<TextView>(R.id.tvSplashSub)
        val tvVersion = findViewById<TextView>(R.id.tvSplashVersion)
        val line = findViewById<View>(R.id.splashLine)

        // Fade in title
        tvTitle.alpha = 0f
        tvTitle.translationY = 30f
        tvTitle.animate().alpha(1f).translationY(0f)
            .setDuration(600).setStartDelay(200).setInterpolator(DecelerateInterpolator()).start()

        // Fade in subtitle
        tvSub.alpha = 0f
        tvSub.animate().alpha(1f).setDuration(500).setStartDelay(600).start()

        // Animate line width
        line.scaleX = 0f
        line.animate().scaleX(1f).setDuration(800).setStartDelay(400)
            .setInterpolator(DecelerateInterpolator()).start()

        tvVersion.alpha = 0f
        tvVersion.animate().alpha(1f).setDuration(400).setStartDelay(800).start()

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, 1800)
    }
}
