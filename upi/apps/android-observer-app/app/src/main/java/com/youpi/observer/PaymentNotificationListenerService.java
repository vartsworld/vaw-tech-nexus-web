package com.youpi.observer;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PaymentNotificationListenerService extends NotificationListenerService {
    private static final String TAG = "YoupiNotifListener";
    private ApiClient apiClient;

    // Generated from packages/common/src/upi-providers.js - Single Source of Truth
    private static final Set<String> ALLOWED_BANKING_PACKAGES = new HashSet<>(Arrays.asList(
        "com.axis.mobile",
        "com.bankofbaroda.mconnect",
        "com.bankofbaroda.upi",
        "com.canarabank.mobility",
        "com.csam.icici.bank.imobile",
        "com.dreamplug.androidapp",
        "com.epifi.paisa",
        "com.fampay.in",
        "com.fedmobile",
        "com.fisglobal.bandhanupi.app",
        "com.freecharge.android",
        "com.google.android.apps.messaging",
        "com.google.android.apps.nbu.paisa.user",
        "com.hdfcbank.payzapp",
        "com.icicibank.pockets",
        "com.idfcfirstbank.optimus",
        "com.infrasoft.uboi",
        "com.infrasofttech.indianbank",
        "com.mgs.induspsp",
        "com.mobikwik_new",
        "com.msf.kbank.mobile",
        "com.myairtelapp",
        "com.nextbillion.groww",
        "com.phonepe.app",
        "com.samsung.android.messaging",
        "com.samsung.android.spay",
        "com.sbi.lotusintouch",
        "com.sbi.upi",
        "com.snapwork.hdfc",
        "com.tatadigital.tcp",
        "com.truecaller",
        "com.upi.axispay",
        "in.amazon.mshop.android.shopping",
        "in.gokiwi.kiwitpap",
        "in.org.npci.upiapp",
        "indwin.c3.shareapp",
        "money.jupiter",
        "net.one97.paytm"
    ));

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?:Rs\\.?|INR|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern UTR_PATTERN = Pattern.compile("(?:UPI\\s*(?:ref|reference|txn|id)?|Ref(?:erence)?\\s*(?:no|number)?|UTR)\\s*[:#-]?\\s*([0-9]{12})", Pattern.CASE_INSENSITIVE);
    private static final Pattern VPA_PATTERN = Pattern.compile("([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)");

    @Override
    public void onCreate() {
        super.onCreate();
        apiClient = new ApiClient(this);
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !apiClient.isPaired()) return;

        // Security Invariant (Issue #24): Strictly discard notifications originating from unverified apps
        final String pkgName = sbn.getPackageName();
        if (pkgName == null || !ALLOWED_BANKING_PACKAGES.contains(pkgName)) {
            return;
        }

        Notification notif = sbn.getNotification();
        if (notif == null) return;

        Bundle extras = notif.extras;
        if (extras == null) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";
        if (bigTextCs != null && bigTextCs.length() > text.length()) {
            text = bigTextCs.toString();
        }

        String full = (title + " " + text).toLowerCase();
        // Check if this looks like a credit / payment received notification
        if (!full.contains("received") && !full.contains("credited") && !full.contains("deposit") && !full.contains("paid you")) {
            return;
        }

        double amount = 0.0;
        Matcher mAmount = AMOUNT_PATTERN.matcher(title + " " + text);
        if (mAmount.find()) {
            try {
                String cleanNum = mAmount.group(1).replace(",", "");
                amount = Double.parseDouble(cleanNum);
            } catch (Exception ignored) {}
        }
        if (amount <= 0.0) return;

        String bankRef = null;
        Matcher mUtr = UTR_PATTERN.matcher(title + " " + text);
        if (mUtr.find()) {
            bankRef = mUtr.group(1);
        }

        String vpa = null;
        Matcher mVpa = VPA_PATTERN.matcher(title + " " + text);
        if (mVpa.find()) {
            vpa = mVpa.group(1);
        }

        final long amountPaise = Math.round(amount * 100);
        final double finalAmount = amount;
        final String finalBankRef = bankRef;
        final String finalVpa = vpa;
        final String finalTitle = title;
        final String finalTex = text;
        final String finalPkg = pkgName;

        Log.i(TAG, "Captured UPI credit notification: ₹" + amount + " UTR: " + bankRef + " from pkg: " + pkgName);

        new Thread(new Runnable() {
            @Override
            public void run() {
                apiClient.sendObservation(amountPaise, finalAmount, finalBankRef, finalVpa, finalTitle, finalTex, finalPkg);
            }
        }).start();
    }
}
