const webdriver = require('selenium-webdriver');    // selenium
const { Builder, By, until, Keys } = webdriver;
const cheerio = require('cheerio');
const fs = require('fs');   // fsモジュールを読み込む
const OutputFilePath = "";  // 出力先のフォルダパスを入力
const OutputFileName = "output_sample.txt";

var driver;          // webdriver
var timeoutMS = 2000;

// 取得URL
var URL = [
    "http://example.com/?eid=1",
    "http://example.com/?eid=2",
    "http://example.com/?eid=3",
    "http://example.com/?eid=4",
    "http://example.com/?eid=5",
    "http://example.com/?eid=6",
    "http://example.com/?eid=7",
    "http://example.com/?eid=8",
    "http://example.com/?eid=9",
    "http://example.com/?eid=10",
    "http://example.com/?eid=11",
];

// 出力内容を保持する変数
let output = "";

// URLからページを表示してタイトル取得
const getHtml = async function () {

    for (let i = 0; i < URL.length; i++) {

        try {

            await driver.get(URL[i]);

            //行儀良くするため1秒待機
            const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            await _sleep(1000);
        
            // タイトルタグを取得する
            let titleElement = await driver.wait(until.elementLocated(By.className('entry_title')), timeoutMS);

            console.log("AUTHOR:Sample Author");// タイトルタグの取得に成功したらエクスポートファイルへの書き込みを開始
            output += "AUTHOR:Sample Author\n"; 

            let titleText = await titleElement.getText();//テキストのみ抽出

            console.log(`TITLE:${titleText}`);
            output += `TITLE:${titleText}\n`;

            // DATE: メニュー:Sample Category | 2024.01.01 Monday 10:00 の形式のテキストをパースする
            let dateElement = await driver.wait(until.elementLocated(By.className('entry_date')), timeoutMS);
            let dateText = await dateElement.getText();

            // プライマリカテゴリと日付、時間を抽出するための正規表現
            const regex = /メニュー:(?<category>[^|]+)\|\s*(?<year>\d{4})\.(?<month>\d{2})\.(?<day>\d{2})\s*\w+\s*(?<time>\d{2}:\d{2})/;
            const match = dateText.match(regex);

            if (match) {
                const { category, year, month, day, time } = match.groups;
                const formattedDate = `${month}/${day}/${year} ${time}`;

                console.log(`PRIMARY CATEGORY:${category.trim()}`);
                console.log(`DATE:${formattedDate}`);
                output += `PRIMARY CATEGORY:${category.trim()}\n`;
                output += `DATE:${formattedDate}\n`;
            } else {
                console.log("No match found");
            }

            // その他固定要素
            console.log("STATUS:Publish");
            console.log("ALLOW COMMENTS:0");
            console.log("ALLOW PINGS:0");
            console.log("CONVERT BREAKS:0");
            console.log("-----");
            output += `STATUS:Publish\nALLOW COMMENTS:0\nALLOW PINGS:0\nCONVERT BREAKS:0\n-----\n`;


            // 序文を取得する
            let leadElement = await driver.wait(until.elementLocated(By.className('jgm_entry_desc_mark')), timeoutMS);
            let leadHTML = await leadElement.getAttribute('outerHTML');

            // cheerioを使用してHTMLを解析し、<script>タグを削除
            const $lead = cheerio.load(leadHTML);

            // <script>タグ、<style>タグ、そして不要な<div id="fb-root">を削除
            $lead('script').remove();
            $lead('style').remove();
            $lead('div#fb-root').remove(); // この行を追加して、特定のdivを削除


            // クラス名に基づいてテキストを抽出し、テキストのみを取得
            let leadText = $lead('.jgm_entry_desc_mark').text(); // クラス名に基づいてテキストを抽出

            console.log("BODY:");
            console.log(leadText);
            console.log("-----");
            output += `BODY:\n${leadText}\n-----\n`;

            // 本文を取得する
            let bodyElement = await driver.wait(until.elementLocated(By.className('entry_more')), timeoutMS);
            let bodyHTML = await bodyElement.getAttribute('outerHTML');
            // cheerioを使用してHTMLからテキストを抽出
            const $body = cheerio.load(bodyHTML);

            // <script>タグ、<style>タグ、そして不要な<div id="fb-root">を削除
            $body('script').remove();
            $body('style').remove();
            $body('div#fb-root').remove(); // この行を追加して、特定のdivを削除

            // let bodyText = $body('.entry_more').text().trim(); // クラス名に基づいてテキストを抽出

            // クラス名に基づいて内部のHTMLを保持
            let bodyInnerHTML = $body('.entry_more').html().trim(); // ここで.html()を使用

            console.log("EXTENDED BODY:");
            console.log(bodyInnerHTML);
            console.log("-----");
            console.log("--------");
            output += `EXTENDED BODY:\n${bodyInnerHTML}\n-----\n--------\n`;

        }

        catch (e) {
            //取得できなかった場合
            console.log(URL[i], ",", "取得失敗");
            continue
        } finally {
            // 各URLの処理が終わるたびにファイルに書き出す
            fs.writeFileSync(OutputFilePath + OutputFileName, output);
        }
    }
}

// メイン処理
const exe = async function () {
    driver = await new Builder().forBrowser('chrome').build();// driver作成
    getHtml().then(function () {
        driver.quit();// driver削除
    });
}

exe()
