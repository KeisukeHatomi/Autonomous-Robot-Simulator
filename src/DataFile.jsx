import React, { useEffect, useRef, useCallback, useState } from "react";
import { Flex, ToggleButtonGroup, Fieldset, Button, TextField, Image, Card, View, ScrollView, Text } from "@aws-amplify/ui-react";
import { getUrl, uploadData, remove } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import * as Styles from "./Styles";
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';

const client = generateClient({
    authMode: "userPool",
});

function DataFile({ layoutData, canvas, onLayoutChange }) {
    console.log('🔵DataFile');
    const [notes, setNotes] = useState([]);
    const [layoutName, setLayoutName] = useState("")
    const [layoutMemo, setLayoutMemo] = useState("")
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);

    async function listData() {
        const { data: notes } = await client.models.Layout.list();
        await Promise.all(
            notes.map(async (note) => {
                console.log('note🔵 ', note);
                if (note.image) {
                    const linkToStorageFile = await getUrl({
                        path: ({ identityId }) => `media/${identityId}/${note.image}`,
                    });
                    note.image = linkToStorageFile.url;
                }
                return note;
            })
        );
        notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setNotes(notes);
    }

    async function handleSave() {

        if (layoutName) {
            const { data: newLayout } = await client.models.Layout.create({
                name: layoutName,
                description: layoutMemo,
                data: JSON.stringify(layoutData),
                image: layoutName + `_${dayjs().format('YYYYMMDDHHmmss')}.png`,
            });
            console.log('newLayout🔵 ', newLayout);

            // s3 にアップロード
            const { byteArray } = await getCanvasImage(canvas);
            if (newLayout.image)
                try {
                    await uploadData({
                        path: ({ identityId }) => `media/${identityId}/${newLayout.image}`,
                        data: byteArray,
                    }).result;

                    listData();

                } catch (error) {
                    console.error('Upload error:', error);
                }

        } else {
            alert("Enter Layout name")
        }
    }

    const getCanvasImage = async (canvas) => {
        // html2canvasを使って、Card(div要素)内の3枚のcanvas要素を一つのcanvasに変換
        const targetCanvas = await html2canvas(canvas)
        // キャンバスをPNG形式のデータURLに変換
        const targetImgUri = targetCanvas.toDataURL("image/png");  //base64, png形式
        // Base64エンコードされたデータをデコードし、それを Uint8Array に変換することで、
        // 正しいバイナリデータ形式に戻し、S3にアップロードする準備が整います。
        const imageData = targetImgUri.split(',')[1]; // Base64データの部分だけを取り出す
        const byteCharacters = atob(imageData); // Base64をデコード
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++)
            byteNumbers[i] = byteCharacters.charCodeAt(i);

        return {
            byteArray: new Uint8Array(byteNumbers),
            base64Image: targetImgUri,
        };
    }

    const handleLoad = ({ data }) => {
        onLayoutChange(data)
    }

    async function deleteNote({ id, image }) {
        console.log('image🔵 ', image.pathname);
        if (confirm("Are you sure?")) {
            const toBeDeletedNote = {
                id: id,
            };
            const { data: deletedNote } = await client.models.Layout.delete(
                toBeDeletedNote
            );
            // このやり方が正しくないと思うが、S3のパス指定のために必要
            // image.pathname の値 /media/********* 頭の / を取り除く
            const filename = decodeURIComponent(image.pathname.slice(1));
            console.log('filename🔵 ', filename);
            await remove({
                path: filename,
            });

            listData();
        }

    }

    const handleChangeLayoutName = (e) => {
        const { value } = e.target
        setLayoutName(value)
    }

    const handleChangeLayoutMemo = (e) => {
        const { value } = e.target
        setLayoutMemo(value)
    }

    const saveAsImage = async () => {
        const { base64Image } = await getCanvasImage(canvas);

        // ダウンロードリンクを作成
        const downloadLink = document.createElement("a");
        if (typeof downloadLink.download === "string") {
            downloadLink.href = base64Image;
            downloadLink.download = `LayoutImage_${dayjs().format('YYYYMMDDHHmmss')}.png`; // ダウンロードするファイル名を指定
            document.body.appendChild(downloadLink);
            downloadLink.click(); // 自動的にクリックしてダウンロードを開始
            document.body.removeChild(downloadLink);
        } else {
            window.open(base64Image); // ダウンロードリンクが使えない場合は新しいタブで開く
        }
    };

    const handleCardClick = ({ id }) => {
        setSelectedCardIndex(id); // 選択されたカードのインデックスを設定
    };

    useEffect(() => {
        listData();
    }, [])

    return (
        <Flex direction="column" gap="small">
            <Flex
                direction="row"
                gap="small"
                marginBottom={20}
            >
                <TextField
                    {...Styles.inputString}
                    width={"200px"}
                    descriptiveText="Layout name"
                    name="layoutName"
                    defaultValue={layoutName}
                    isRequired={true}
                    onChange={(e) => handleChangeLayoutName(e)}
                ></TextField>
                <TextField
                    {...Styles.inputString}
                    width={"100%"}
                    descriptiveText="Description"
                    name="layoutMemo"
                    defaultValue={layoutMemo}
                    onChange={(e) => handleChangeLayoutMemo(e)}
                ></TextField>

            </Flex>
            <Flex
                direction="row"
                gap="small"
                marginBottom={20}
            >
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={saveAsImage}>Download Layout image</Button>

            </Flex>
            <View
                width="100%"
                height="450px"
                overflow="auto"
                border="none"
                borderRadius="6px"
            >
                <ScrollView direction="vertical" height="100%">
                    {notes.map((note) => (
                        <Card
                            key={note.id}
                            padding="10px"
                            margin="10px 0"
                            borderRadius="10px"
                            boxShadow="0px 4px 8px rgba(0, 0, 0, 0.1)"
                            onDoubleClick={() => handleLoad(note)}
                            onClick={() => handleCardClick(note)}
                            backgroundColor={selectedCardIndex === note.id ? '#e0f7fa' : 'white'} // 選択状態の背景色
                        >
                            <Flex direction="row" alignItems="center">
                                <Image src={note.image} alt={note.name} width="180px" height="120px" objectFit="cover" borderRadius="8px" />
                                <Flex direction="column" justifyContent="center" marginLeft="20px">
                                    <Text as="h3" fontWeight="bold" margin="10px 0 5px 0">{note.name}</Text>
                                    <Text>{note.description}</Text>
                                    <Text>{dayjs(note.updatedAt).format('YYYY/MM/DD HH:mm')}</Text>
                                    <Button width={"60px"} onClick={() => deleteNote(note)} size="small">Delete</Button>
                                </Flex>
                            </Flex>
                        </Card>
                    ))}
                </ScrollView>
            </View>

        </Flex>
    )
}

export default DataFile;
