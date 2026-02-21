/**
 * 🖼️ Luna Villa — 丸型アバタークロップモーダル
 * 画像選択 → ピンチズーム + パン移動 → 丸型切り抜き → 保存
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    Dimensions,
    PanResponder,
    Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { documentDirectory, copyAsync } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CROP_SIZE = SCREEN_WIDTH * 0.7; // 切り抜き円のサイズ
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (uri: string) => void;
}

export default function AvatarCropModal({ visible, onClose, onSave }: Props) {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

    // ジェスチャー用の状態（Animated + PanResponder）
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const scale = useRef(new Animated.Value(1)).current;
    const lastPan = useRef({ x: 0, y: 0 });
    const lastScale = useRef(1);
    const lastDistance = useRef(0);

    // スライダー連動用
    const [sliderValue, setSliderValue] = useState(0); // 0 to 1 (MIN to MAX)

    useEffect(() => {
        // スライダーの値が変更されたらスケールに反映
        const s = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * sliderValue;
        scale.setValue(s);
        lastScale.current = s;
    }, [sliderValue]);

    // PanResponder（パン + ピンチ）
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                lastDistance.current = 0;
            },

            onPanResponderMove: (evt, gestureState) => {
                const touches = evt.nativeEvent.touches;

                if (touches.length >= 2) {
                    // ─── ピンチズーム ───
                    const dx = touches[0].pageX - touches[1].pageX;
                    const dy = touches[0].pageY - touches[1].pageY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (lastDistance.current > 0) {
                        const ratio = distance / lastDistance.current;
                        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale.current * ratio));
                        scale.setValue(newScale);
                        // スライダー同期
                        setSliderValue((newScale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE));
                    }
                    lastDistance.current = distance;
                } else {
                    // ─── パン移動 ───
                    pan.setValue({
                        x: lastPan.current.x + gestureState.dx,
                        y: lastPan.current.y + gestureState.dy,
                    });
                }
            },

            onPanResponderRelease: () => {
                // 現在の値をキャッシュ
                // @ts-ignore
                lastPan.current = { x: pan.x._value, y: pan.y._value };
                // @ts-ignore
                lastScale.current = scale._value;
                lastDistance.current = 0;
            },
        })
    ).current;

    // 画像選択
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setImageUri(asset.uri);
                setImageSize({ width: asset.width || 1, height: asset.height || 1 });
                // リセット
                pan.setValue({ x: 0, y: 0 });
                scale.setValue(1);
                lastPan.current = { x: 0, y: 0 };
                lastScale.current = 1;
                setSliderValue((1 - MIN_SCALE) / (MAX_SCALE - MIN_SCALE));
            }
        } catch (e) {
            console.error('Pick error:', e);
        }
    };

    // 切り抜き実行
    const handleCrop = async () => {
        if (!imageUri) return;

        try {
            // 画面上での画像表示サイズ（画面幅いっぱいに表示）
            const displayScale = SCREEN_WIDTH / imageSize.width;
            // 現在のジェスチャー値取得
            // @ts-ignore
            const currentScale = scale._value;
            // @ts-ignore
            const currentPanX = pan.x._value;
            // @ts-ignore
            const currentPanY = pan.y._value;

            // 実際のスケール（displayScale × userScale）
            const totalScale = displayScale * currentScale;

            // 表示画像全体のサイズ
            const displayedWidth = imageSize.width * totalScale;
            const displayedHeight = imageSize.height * totalScale;

            // 切り抜きエリアの中心（画面中央）
            const cropCenterX = SCREEN_WIDTH / 2;
            const cropCenterY = SCREEN_WIDTH / 2; // 正方形エリアの中央

            // 画像の左上位置（画面中央を基準に配置）
            const imageLeft = (SCREEN_WIDTH - displayedWidth) / 2 + currentPanX;
            const imageTop = (SCREEN_WIDTH - displayedHeight) / 2 + currentPanY;

            // 切り抜きエリアの左上は (cropCenterX - CROP_SIZE/2, cropCenterY - CROP_SIZE/2)
            const cropLeft = cropCenterX - CROP_SIZE / 2;
            const cropTop = cropCenterY - CROP_SIZE / 2;

            // 画像座標系に変換
            const originX = (cropLeft - imageLeft) / totalScale;
            const originY = (cropTop - imageTop) / totalScale;
            const cropSizeOriginal = CROP_SIZE / totalScale;

            // クランプ
            const x = Math.max(0, Math.min(originX, imageSize.width - cropSizeOriginal));
            const y = Math.max(0, Math.min(originY, imageSize.height - cropSizeOriginal));
            const size = Math.min(cropSizeOriginal, imageSize.width - x, imageSize.height - y);

            // ImageManipulatorで切り抜き + リサイズ
            const manipulated = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    {
                        crop: {
                            originX: Math.round(x),
                            originY: Math.round(y),
                            width: Math.round(size),
                            height: Math.round(size),
                        },
                    },
                    { resize: { width: 256, height: 256 } },
                ],
                { compress: 0.9, format: ImageManipulator.SaveFormat.PNG }
            );

            // ローカルに保存
            const destPath = `${documentDirectory}luna_avatar.png`;
            await copyAsync({ from: manipulated.uri, to: destPath });
            await AsyncStorage.setItem('luna_avatar_uri', destPath);

            onSave(destPath);
            setImageUri(null);
            onClose();
        } catch (e: any) {
            console.error('Crop error:', e);
        }
    };

    const handleCancel = () => {
        setImageUri(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide">
            <View style={[styles.container, { backgroundColor: Colors?.background || '#000' }]}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel}>
                        <Text style={styles.headerButton}>キャンセル</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>アイコン設定</Text>
                    {imageUri ? (
                        <TouchableOpacity onPress={handleCrop}>
                            <Text style={[styles.headerButton, styles.headerSave]}>完了</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 60 }} />
                    )}
                </View>

                {imageUri ? (
                    /* ─── クロップエリア ─── */
                    <View style={styles.cropContainer}>
                        <View style={styles.cropArea} {...panResponder.panHandlers}>
                            {/* 画像 */}
                            <Animated.Image
                                source={{ uri: imageUri }}
                                style={[
                                    styles.cropImage,
                                    {
                                        width: SCREEN_WIDTH,
                                        height: SCREEN_WIDTH * (imageSize.height / imageSize.width),
                                        transform: [
                                            { translateX: pan.x },
                                            { translateY: pan.y },
                                            { scale: scale },
                                        ],
                                    },
                                ]}
                                resizeMode="contain"
                            />

                            {/* 丸型オーバーレイ */}
                            <View style={styles.overlayContainer} pointerEvents="none">
                                {/* 上 */}
                                <View style={[styles.overlay, { height: (SCREEN_WIDTH - CROP_SIZE) / 2 }]} />
                                {/* 中央行 */}
                                <View style={styles.middleRow}>
                                    <View style={[styles.overlay, { width: (SCREEN_WIDTH - CROP_SIZE) / 2 }]} />
                                    <View style={styles.circle} />
                                    <View style={[styles.overlay, { width: (SCREEN_WIDTH - CROP_SIZE) / 2 }]} />
                                </View>
                                {/* 下 */}
                                <View style={[styles.overlay, { flex: 1 }]} />
                            </View>
                        </View>

                        {/* 🎚️ ズームスライダー (カスタム実装) */}
                        <View style={styles.sliderSection}>
                            <Text style={styles.sliderLabel}>🔍 ズーム</Text>
                            <View style={styles.sliderTrack}>
                                <View style={styles.sliderBar} />
                                <PanResponderSlider
                                    value={sliderValue}
                                    onChange={setSliderValue}
                                />
                            </View>
                        </View>

                        {/* 操作ヒント */}
                        <View style={styles.hintArea}>
                            <Text style={styles.hintText}>☝️ 移動 / 🤏 ピンチでズーム</Text>
                        </View>
                    </View>
                ) : (
                    /* ─── 画像選択画面 ─── */
                    <View style={styles.pickerArea}>
                        <View style={styles.placeholderCircle}>
                            <Text style={styles.placeholderEmoji}>🌙</Text>
                        </View>
                        <Text style={styles.pickerTitle}>るなのアイコンを設定♡</Text>
                        <Text style={styles.pickerDesc}>
                            ギャラリーから画像を選んでね
                        </Text>
                        <TouchableOpacity style={styles.pickButton} onPress={pickImage} activeOpacity={0.7}>
                            <Text style={styles.pickButtonText}>📷 画像を選ぶ</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

// 🎚️ カスタムスライダーコンポーネント
function PanResponderSlider({ value, onChange }: { value: number, onChange: (v: number) => void }) {
    const trackWidth = SCREEN_WIDTH - 80;
    const thumbX = useRef(new Animated.Value(value * trackWidth)).current;

    useEffect(() => {
        Animated.spring(thumbX, {
            toValue: value * trackWidth,
            useNativeDriver: false,
            tension: 100,
        }).start();
    }, [value]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                const newX = Math.max(0, Math.min(trackWidth, gestureState.moveX - 40));
                onChange(newX / trackWidth);
            },
        })
    ).current;

    return (
        <View style={styles.sliderThumbContainer} {...panResponder.panHandlers}>
            <Animated.View style={[styles.sliderThumb, { transform: [{ translateX: thumbX }] }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // クロップ時は黒背景が集中しやすい
    },
    // ─── ヘッダー ───────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors?.surface || '#1A1730',
        borderBottomWidth: 1,
        borderBottomColor: Colors?.border || 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    headerButton: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        minWidth: 60,
    },
    headerSave: {
        color: Colors.primary,
        fontWeight: '700',
        textAlign: 'right',
    },
    // ─── クロップエリア ──────
    cropContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    cropArea: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH,
        overflow: 'hidden',
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cropImage: {
        position: 'absolute',
    },
    // ─── 丸型オーバーレイ ───
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    middleRow: {
        flexDirection: 'row',
        height: CROP_SIZE,
    },
    circle: {
        width: CROP_SIZE,
        height: CROP_SIZE,
        borderRadius: CROP_SIZE / 2,
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: 'transparent',
        // 丸をくり抜く効果は周囲の暗いオーバーレイで実現
        // 実際の「穴」にはならないが視覚的に十分
        // shadowColor: Colors.primary, // Removed shadow for cleaner look
        // shadowOffset: { width: 0, height: 0 },
        // shadowOpacity: 0.5,
        // shadowRadius: 10,
    },
    // ─── ズームスライダー ───
    sliderSection: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    sliderLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginBottom: Spacing.md,
        fontWeight: '600',
    },
    sliderTrack: {
        width: SCREEN_WIDTH - 80,
        height: 40,
        justifyContent: 'center',
    },
    sliderBar: {
        height: 4,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 2,
    },
    sliderThumbContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH - 80,
        height: 40,
        justifyContent: 'center',
    },
    sliderThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        borderWidth: 3,
        borderColor: '#fff',
        position: 'absolute',
        left: -12, // 中心の補正
    },
    hintArea: {
        paddingBottom: Spacing.xl,
        alignItems: 'center',
    },
    hintText: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
    },
    // ─── 画像選択 ─────────
    pickerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    placeholderCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        marginBottom: Spacing.xl,
    },
    placeholderEmoji: {
        fontSize: 48,
    },
    pickerTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    pickerDesc: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    pickButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
    },
    pickButtonText: {
        color: '#fff',
        fontSize: FontSize.lg,
        fontWeight: '600',
    },
});
