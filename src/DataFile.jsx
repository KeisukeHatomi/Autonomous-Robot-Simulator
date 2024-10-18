import React, { useEffect, useRef, useCallback, useState } from "react";
import { Flex, ToggleButtonGroup, Fieldset, Button, TextField } from "@aws-amplify/ui-react";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import * as Styles from "./Styles";

const client = generateClient({
    authMode: "userPool",
});

function DataFile() {
    const [notes, setNotes] = useState([]);
    const [layoutName, setLayoutName] = useState("")
    const [layoutMemo, setLayoutMemo] = useState("")

    // useEffect(() => {
    //     fetchNotes();
    // }, []);

    async function fetchNotes() {
        const { data: notes } = await client.models.Layout.list();
        await Promise.all(
            notes.map(async (note) => {
                if (note.image) {
                    const linkToStorageFile = await getUrl({
                        path: ({ identityId }) => `media/${identityId}/${note.image}`,
                    });
                    note.image = linkToStorageFile.url;
                }
                return note;
            })
        );
        setNotes(notes);
    }

    async function handleSave() {
        console.log('layoutName🔵 ', layoutName);
        if (layoutName) {
            const { data: newLayout } = await client.models.Layout.create({
                name: layoutName,
                description: layoutMemo,
                vehicle: "",
                cart: "",
                course: "",
                image: "",
            });

            console.log(newLayout);
        } else {
            alert("Enter Layout name")
        }
        // if (newLayoutName.image)
        //     if (newLayoutName.image)
        //         await uploadData({
        //             path: ({ identityId }) => `media/${identityId}/${newLayoutName.image}`,

        //             data: form.get("image"),
        //         }).result;

    }

    async function deleteNote({ id }) {
        const toBeDeletedNote = {
            id: id,
        };

        const { data: deletedNote } = await client.models.Layout.delete(
            toBeDeletedNote
        );

        fetchNotes();
    }

    const handleChangeLayoutName = (e) => {
        const { value } = e.target
        setLayoutName(value)
    }

    const handleChangeLayoutMemo = (e) => {
        const { value } = e.target
        setLayoutMemo(value)
    }

    return (
        <Flex direction="row" gap="small">
            <Flex
                direction="column"
                gap="small"
                marginBottom={20}
            >
                <TextField
                    {...Styles.inputString}
                    descriptiveText="Layout name"
                    name="layoutName"
                    defaultValue={layoutName}
                    isRequired={true}
                    onChange={(e) => handleChangeLayoutName(e)}
                ></TextField>
                <TextField
                    {...Styles.inputString}
                    descriptiveText="Layout description"
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
                <Button>Load</Button>
            </Flex>
        </Flex>
    )
}

export default DataFile;
